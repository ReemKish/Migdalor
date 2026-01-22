import { BAHAD_GROUP_KEY_ID } from 'lib/consts';
import { supabase } from 'lib/supabaseClient';
import React, { useEffect, useState } from 'react';


export default function KeyRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  /**
 * Finds a specific ancestor group by its type (e.g., 'Battalion', 'Company')
 * @param {number} startGroupId - The ID of the group to start searching from (e.g., user.group_id)
 * @param {string} targetTypeName - The name of the group_type you are looking for
 * @returns {Object|null} - Returns the group object if found, otherwise null
 */
  const fetchAncestorGroup = async (startGroupId, targetTypeName) => {
    try {
      const { data, error } = await supabase
        .rpc('get_parent_group_by_type', {
          start_group_id: startGroupId,
          target_type_name: targetTypeName
        });

      if (error) {
        console.error("RPC Error:", error.message);
        return null;
      }

      // data is returned as an array of rows. 
      // Since our SQL uses LIMIT 1, we just need the first item.
      return data && data.length > 0 ? data[0] : null;

    } catch (err) {
      console.error("Unexpected Error:", err);
      return null;
    }
  };


  async function fetchRequests() {
    setLoading(true);
    // 1. Fetch the requests
    const { data, error } = await supabase
      .from('keys_request')
      .select('*, requester (id, name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      // 2. Map through requests and fetch the Battalion for each one
      // We use Promise.all to do this efficiently in parallel
      const requestsWithBattalion = await Promise.all(
        data.map(async (req) => {
          const { data: battalionData } = await supabase.rpc('get_parent_group_by_type', {
            start_group_id: req.requester.id,
            target_type_name: 'Battalion',
          });

          return {
            ...req,
            battalion_name: battalionData?.[0]?.name || 'N/A',
          };
        })
      );

      setRequests(requestsWithBattalion);
    }
    setLoading(false);
  }

  async function handleDistributeEqually() {
    const confirm = window.confirm("האם לחלק מפתחות על בסיס הכמויות המבוקשות ולהקצות לרמת הגדוד?");
    if (!confirm) return;

    setLoading(true);

    try {
      // 1. Fetch ALL available keys
      const { data: availableKeys, error: keyErr } = await supabase
        .from('keysmanager_keys')
        .select('*')
        .eq('assigned_group_id', BAHAD_GROUP_KEY_ID);

      if (keyErr) throw keyErr;

      // 2. Filter keys by category
      let smallKeys = availableKeys.filter(k => k.room_type_id === 1);
      let largeKeys = availableKeys.filter(k => k.room_type_id === 2);

      // 3. Get pending requests
      const pending = requests.filter(r => r.status === 'pending');
      if (!pending.length) {
        alert("אין בקשות ממתינות.");
        return;
      }

      const updates = [];
      const battalionMap = {};

      // 4. Process each request
      for (const req of pending) {
        // Resolve Battalion ID (Ancestor)
        if (!battalionMap[req.requester.id]) {
          const ancestor = await fetchAncestorGroup(req.requester.id, "Battalion");
          battalionMap[req.requester.id] = ancestor ? ancestor.id : req.requester.id;
        }
        const targetGroupId = battalionMap[req.requester.id];

        // Calculate how many keys this request needs
        // Note: single_team and two_team both usually take 'צוותי' rooms
        console.log("request: ", req)
        const needsSmall = (req.single_team_amount || 0) + (req.two_team_amount || 0);
        const needsLarge = (req.company_amount || 0);

        console.log(`group ${targetGroupId} needs ${needsSmall} smalll and ${needsLarge} large`)

        // Assign Small Keys
        for (let i = 0; i < needsSmall; i++) {
          if (smallKeys.length > 0) {
            const key = smallKeys.shift(); // Remove from available pool
            updates.push({ id: key.id, assigned_group_id: targetGroupId, created_at: key.created_at, status: key.status, room_number: key.room_number, has_computers: key.has_computers });
          }
        }

        // Assign Large Keys
        for (let i = 0; i < needsLarge; i++) {
          if (largeKeys.length > 0) {
            const key = largeKeys.shift(); // Remove from available pool
            updates.push({ id: key.id, assigned_group_id: targetGroupId, created_at: key.created_at, status: key.status, room_number: key.room_number, has_computers: key.has_computers });
          }
        }
      }

      // 5. Execute Updates
      if (updates.length > 0) {
        const { error: upsertErr } = await supabase
          .from('keysmanager_keys')
          .upsert(updates);
        if (upsertErr) throw upsertErr;
      }

      // 6. Mark requests as approved
      const requestIds = pending.map(r => r.id);
      await supabase.from('keys_request').update({ status: 'approved' }).in('id', requestIds);

      alert(`הוקצו ${updates.length} מפתחות בהצלחה.`);
      fetchRequests();

    } catch (err) {
      console.error(err);
      alert("שגיאה בחלוקה: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // async function handleDistributeEqually() {
  //   const confirm = window.confirm("Assign all available keys equally to the Requester's Battalion?");
  //   if (!confirm) return;
  //
  //   setLoading(true);
  //
  //   try {
  //     // 1. Fetch available keys
  //     const { data: availableKeys, error: keyErr } = await supabase
  //       .from('keysmanager_keys')
  //       .select('*')
  //       .eq('assigned_group_id', BAHAD_GROUP_KEY_ID);
  //
  //     // 2. Fetch pending requests
  //     const pending = requests.filter(r => r.status === 'pending');
  //
  //     if (keyErr || !availableKeys.length || !pending.length) {
  //       alert("No keys available or no pending requests.");
  //       return;
  //     }
  //
  //     // 3. NEW: Resolve the Battalion IDs for all unique requesters first
  //     // This prevents calling the RPC 50 times for the same group
  //     const battalionMap = {};
  //     for (const req of pending) {
  //       const requesterId = req.requester.id;
  //       if (!battalionMap[requesterId]) {
  //         const ancestor = await fetchAncestorGroup(requesterId, "Battalion");
  //         // Fallback to the requester ID if no battalion is found
  //         battalionMap[requesterId] = ancestor ? ancestor.id : requesterId;
  //       }
  //     }
  //
  //     // 4. Create the updates using the resolved Battalion IDs
  //     const updates = availableKeys.map((key, index) => {
  //       const targetRequest = pending[index % pending.length];
  //       const targetBattalionId = battalionMap[targetRequest.requester.id];
  //
  //       return {
  //         id: key.id,
  //         assigned_group_id: targetBattalionId, // Now correctly assigned to Battalion
  //         room_number: key.room_number,
  //         has_computers: key.has_computers,
  //         status: 'occupied', // Optional: update status to occupied
  //       };
  //     });
  //
  //     // 5. Batch Update keys
  //     const { error: upsertErr } = await supabase.from('keysmanager_keys').upsert(updates);
  //     if (upsertErr) throw upsertErr;
  //
  //     // 6. Approve the requests
  //     const requestIds = pending.map(r => r.id);
  //     await supabase.from('keys_request').update({ status: 'approved' }).in('id', requestIds);
  //
  //     alert(`Distributed ${availableKeys.length} keys to Battalions.`);
  //     fetchRequests();
  //   } catch (err) {
  //     alert("Error: " + err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Key Requests</h1>
        <button
          onClick={handleDistributeEqually}
          disabled={loading}
          style={{ padding: '10px 20px', cursor: 'pointer', background: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}
        >
          {loading ? 'Processing...' : 'Distribute Equally & Approve All'}
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
            <th>Requester</th>
            <th>Single</th>
            <th>Two-Team</th>
            <th>Company</th>
            <th>Total</th>
            <th>Range</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(req => (
            <tr key={req.id} style={{ borderBottom: '1px solid #eee' }}>
              <td>{req.battalion_name}</td>
              <td>{req.single_team_amount}</td>
              <td>{req.two_team_amount}</td>
              <td>{req.company_amount}</td>
              <td>{req.company_amount + req.two_team_amount + req.single_team_amount}</td>
              <td>{req.range_start} to {req.range_end}</td>
              <td>
                <b style={{ color: req.status === 'pending' ? 'orange' : 'green' }}>
                  {req.status.toUpperCase()}
                </b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
