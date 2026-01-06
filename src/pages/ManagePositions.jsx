import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Briefcase, Loader2, Plus, Shield, X } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

export default function ManagePositions() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newPositionTitle, setNewPositionTitle] = useState('');
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ['positions'],
    queryFn: () => base44.entities.PositionRole.list('order'),
    enabled: isAdmin
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin
  });

  const createPositionMutation = useMutation({
    mutationFn: (data) => base44.entities.PositionRole.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      setShowModal(false);
      setNewPositionTitle('');
      toast.success('תפקיד נוסף בהצלחה');
    }
  });

  const deletePositionMutation = useMutation({
    mutationFn: (id) => base44.entities.PositionRole.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast.success('תפקיד נמחק');
    }
  });

  const handleAddPosition = () => {
    if (newPositionTitle && newPositionTitle.trim()) {
      createPositionMutation.mutate({ 
        title: newPositionTitle.trim(), 
        order: positions.length 
      });
    }
  };

  // Count users per position
  const getUserCountForPosition = (positionTitle) => {
    return users.filter(user => 
      user.positions && user.positions.includes(positionTitle)
    ).length;
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">גישה מוגבלת</h2>
          <p className="text-slate-500">רק מנהלים יכולים לגשת לדף זה</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            ניהול תפקידים 💼
          </h1>
          <p className="text-slate-500">הוסף, ערוך, ומחק תפקידים במערכת</p>
        </motion.div>

        {/* Stats */}
        <div className="mb-6">
          <Card className="p-4 border-slate-200">
            <p className="text-sm text-slate-500">סה״כ תפקידים</p>
            <p className="text-2xl font-bold text-slate-800">{positions.length}</p>
          </Card>
        </div>

        {/* Add Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 ml-2" />
            הוסף תפקיד חדש
          </Button>
        </div>

        {/* Positions List */}
        <Card className="p-6 border-slate-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400">אין תפקידים. הוסף את התפקיד הראשון</p>
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((position) => {
                const userCount = getUserCountForPosition(position.title);
                return (
                  <div
                    key={position.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-indigo-600" />
                      <span className="text-lg font-medium text-slate-800">
                        {position.title}
                      </span>
                      <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        {userCount} {userCount === 1 ? 'משתמש' : 'משתמשים'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`למחוק את התפקיד "${position.title}"?`)) {
                          deletePositionMutation.mutate(position.id);
                        }
                      }}
                      className="hover:bg-red-50 rounded-full p-2 transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Add Position Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="flex flex-row-reverse items-center gap-2 justify-end">
              הוסף תפקיד חדש
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-indigo-600" />
              </div>
            </DialogTitle>
            <DialogDescription className="text-right">
              הזן את שם התפקיד החדש
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-right block">שם התפקיד *</Label>
              <Input
                value={newPositionTitle}
                onChange={(e) => setNewPositionTitle(e.target.value)}
                placeholder="לדוגמה: קה״ד צוותי"
                className="text-right"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPositionTitle.trim()) {
                    handleAddPosition();
                  }
                }}
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-row-reverse gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowModal(false);
                setNewPositionTitle('');
              }} 
              className="flex-1"
            >
              ביטול
            </Button>
            <Button
              onClick={handleAddPosition}
              disabled={!newPositionTitle.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              הוסף תפקיד
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}