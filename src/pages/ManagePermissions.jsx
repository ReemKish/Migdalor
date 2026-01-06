import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Loader2, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ManagePermissions() {
  const [expandedPosition, setExpandedPosition] = useState(null);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === 'admin';

  // Fetch positions
  const { data: positions = [], isLoading: positionsLoading } = useQuery({
    queryKey: ['positions'],
    queryFn: () => base44.entities.PositionRole.list('order'),
    enabled: isAdmin
  });

  // Fetch existing permissions
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => base44.entities.Positionpermission.list(),
    enabled: isAdmin
  });

  // Available pages for access control
  const availablePages = [
    { id: 'Dashboard', name: 'לוח בקרה', area: 'classroom' },
    { id: 'DailyOverview', name: 'תמונת מצב', area: 'classroom' },
    { id: 'KeyAllocation', name: 'הקצאת מפתחות', area: 'classroom' },
    { id: 'ManageKeys', name: 'ניהול מפתחות', area: 'classroom' },
    { id: 'MySchedule', name: 'לוח הזמנים שלי', area: 'classroom' },
    { id: 'ManageCrews', name: 'ניהול פלוגות', area: 'classroom' },
    { id: 'ManageSquads', name: 'ניהול צוותים', area: 'classroom' },
    { id: 'HackalonSchedule', name: 'HackAlon - לוח זמנים', area: 'hackalon' },
    { id: 'HackalonTeamArea', name: 'HackAlon - אזור הצוות', area: 'hackalon' },
    { id: 'HackalonOverview', name: 'HackAlon - סקירה', area: 'hackalon' },
    { id: 'HackalonStatus', name: 'HackAlon - תמונת מצב', area: 'hackalon' },
    { id: 'HackalonAssignment', name: 'HackAlon - שיבוץ צוערים', area: 'hackalon' },
    { id: 'HackalonManageProblems', name: 'HackAlon - ניהול בעיות', area: 'hackalon' },
  ];
  
  // Pages under classroom management (only these require access toggle)
  const classroomPages = availablePages.filter(p => p.area === 'classroom');
  const hackalonPages = availablePages.filter(p => p.area === 'hackalon');

  // Available entities for CRUD permissions
  const availableEntities = [
    { id: 'ClassroomKeys', name: 'מפתחות כיתות' },
    { id: 'Lesson', name: 'שיעורים' },
    { id: 'WaitingQueue', name: 'תור המתנה' },
    { id: 'Crew', name: 'פלוגות' },
    { id: 'Squad', name: 'צוותים' },
  ];

  const crudOptions = [
    { id: 'read', name: 'צפייה', icon: '👁️' },
    { id: 'create', name: 'יצירה', icon: '➕' },
    { id: 'update', name: 'עריכה', icon: '✏️' },
    { id: 'delete', name: 'מחיקה', icon: '🗑️' },
  ];

  // Get permission for a specific position
  const getPermissionForPosition = (positionId) => {
    return permissions.find(p => p.position_id === positionId);
  };

  // Update permissions mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ positionId, positionName, pagesAccess, entityPermissions, hasClassroomAccess }) => {
      const existing = getPermissionForPosition(positionId);
      
      if (existing) {
        return base44.entities.Positionpermission.update(existing.id, {
          pages_access: pagesAccess,
          entity_permissions: entityPermissions,
          has_classroom_management_access: hasClassroomAccess
        });
      } else {
        return base44.entities.Positionpermission.create({
          position_id: positionId,
          position_name: positionName,
          pages_access: pagesAccess,
          entity_permissions: entityPermissions,
          has_classroom_management_access: hasClassroomAccess || false
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      toast.success('ההרשאות עודכנו בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה בעדכון ההרשאות');
    }
  });

  // Handle classroom management access toggle
  const handleClassroomAccessToggle = (position) => {
    const permission = getPermissionForPosition(position.id);
    const newAccess = !permission?.has_classroom_management_access;

    updatePermissionMutation.mutate({
      positionId: position.id,
      positionName: position.title,
      pagesAccess: permission?.pages_access || [],
      entityPermissions: permission?.entity_permissions || {},
      hasClassroomAccess: newAccess
    });
  };

  // Handle page access toggle
  const handlePageToggle = (position, pageId) => {
    const permission = getPermissionForPosition(position.id);
    const currentPages = permission?.pages_access || [];
    const newPages = currentPages.includes(pageId)
      ? currentPages.filter(p => p !== pageId)
      : [...currentPages, pageId];

    updatePermissionMutation.mutate({
      positionId: position.id,
      positionName: position.title,
      pagesAccess: newPages,
      entityPermissions: permission?.entity_permissions || {},
      hasClassroomAccess: permission?.has_classroom_management_access || false
    });
  };

  // Handle entity CRUD toggle
  const handleEntityCrudToggle = (position, entityId, crudType) => {
    const permission = getPermissionForPosition(position.id);
    const currentEntityPerms = permission?.entity_permissions || {};
    const currentCrud = currentEntityPerms[entityId] || [];
    
    const newCrud = currentCrud.includes(crudType)
      ? currentCrud.filter(c => c !== crudType)
      : [...currentCrud, crudType];

    const newEntityPerms = {
      ...currentEntityPerms,
      [entityId]: newCrud
    };

    updatePermissionMutation.mutate({
      positionId: position.id,
      positionName: position.title,
      pagesAccess: permission?.pages_access || [],
      entityPermissions: newEntityPerms,
      hasClassroomAccess: permission?.has_classroom_management_access || false
    });
  };

  if (!user || positionsLoading || permissionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center" dir="rtl">
        <Card className="p-8 text-center max-w-md">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">אין הרשאת גישה</h2>
          <p className="text-slate-600">רק מנהלי מערכת יכולים לנהל הרשאות תפקידים</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            ניהול הרשאות תפקידים 🔐
          </h1>
          <p className="text-slate-500">
            הגדר לכל תפקיד אילו עמודים וישויות הוא יכול לגשת אליהם
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-slate-500">סה״כ תפקידים</p>
            <p className="text-2xl font-bold text-slate-800">{positions.length}</p>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-600">תפקידים עם הרשאות</p>
            <p className="text-2xl font-bold text-blue-700">{permissions.length}</p>
          </Card>
          <Card className="p-4 bg-green-50 border-green-200">
            <p className="text-sm text-green-600">עמודים זמינים</p>
            <p className="text-2xl font-bold text-green-700">{availablePages.length}</p>
          </Card>
        </div>

        {/* Positions List */}
        <div className="space-y-4">
          {positions.map((position, index) => {
            const permission = getPermissionForPosition(position.id);
            const isExpanded = expandedPosition === position.id;
            const pagesAccess = permission?.pages_access || [];
            const entityPermissions = permission?.entity_permissions || {};

            return (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  {/* Position Header */}
                  <div
                    onClick={() => setExpandedPosition(isExpanded ? null : position.id)}
                    className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">
                            {position.title}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {pagesAccess.length} עמודים • {Object.keys(entityPermissions).length} ישויות
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-6 border-t border-slate-200 bg-slate-50/50">
                      {/* Main Classroom Management Access Toggle */}
                      <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        <div
                          onClick={() => handleClassroomAccessToggle(position)}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <Checkbox checked={permission?.has_classroom_management_access || false} />
                          <div>
                            <Label className="cursor-pointer text-base font-semibold text-blue-900">
                              גישה לניהול כיתות
                            </Label>
                            <p className="text-sm text-blue-700 mt-1">
                              סמן כדי לאפשר גישה לכל מערכת ניהול הכיתות
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Show pages and entities only if classroom access is enabled */}
                      {permission?.has_classroom_management_access && (
                        <>
                          {/* Pages Access */}
                          <div className="mb-6">
                        <h4 className="text-md font-semibold text-slate-700 mb-3">
                          גישה לעמודים - ניהול כיתות
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {classroomPages.map((page) => {
                            const hasAccess = pagesAccess.includes(page.id);
                            return (
                              <div
                                key={page.id}
                                onClick={() => handlePageToggle(position, page.id)}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  hasAccess
                                    ? 'bg-blue-50 border-blue-300'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Checkbox checked={hasAccess} />
                                  <Label className="cursor-pointer text-sm">
                                    {page.name}
                                  </Label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* HackAlon Pages Access */}
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-slate-700 mb-3">
                          גישה לעמודים - HackAlon
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {hackalonPages.map((page) => {
                            const hasAccess = pagesAccess.includes(page.id);
                            return (
                              <div
                                key={page.id}
                                onClick={() => handlePageToggle(position, page.id)}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  hasAccess
                                    ? 'bg-purple-50 border-purple-300'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Checkbox checked={hasAccess} />
                                  <Label className="cursor-pointer text-sm">
                                    {page.name}
                                  </Label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Entity Permissions */}
                      <div>
                        <h4 className="text-md font-semibold text-slate-700 mb-3">
                          הרשאות CRUD על ישויות
                        </h4>
                        <div className="space-y-3">
                          {availableEntities.map((entity) => {
                            const entityCrud = entityPermissions[entity.id] || [];
                            return (
                              <Card key={entity.id} className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <Label className="font-medium text-slate-700">
                                    {entity.name}
                                  </Label>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  {crudOptions.map((crud) => {
                                    const hasCrud = entityCrud.includes(crud.id);
                                    return (
                                      <div
                                        key={crud.id}
                                        onClick={() => handleEntityCrudToggle(position, entity.id, crud.id)}
                                        className={`p-2 rounded-lg border-2 cursor-pointer transition-all text-center ${
                                          hasCrud
                                            ? 'bg-green-50 border-green-300'
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}
                                      >
                                        <div className="flex flex-col items-center gap-1">
                                          <span className="text-lg">{crud.icon}</span>
                                          <span className="text-xs font-medium">
                                            {crud.name}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </Card>
                            );
                            })}
                            </div>
                            </div>
                            </>
                            )}
                            </div>
                            )}
                            </Card>
                            </motion.div>
                            );
                            })}

          {positions.length === 0 && (
            <Card className="p-12 text-center">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">
                אין תפקידים עדיין
              </h3>
              <p className="text-slate-400">
                צור תפקידים בעמוד ניהול התפקידים כדי להתחיל להגדיר הרשאות
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}