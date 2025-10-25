import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { XIcon, DownloadIcon, ImageIcon } from '@/components/icons';
import { db } from '@/config/firebase';
import { collection, query, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface ErrorReport {
  id: string;
  userId: string;
  username: string;
  department: string;
  position: string;
  type: string;
  failedImageUrl?: string;
  attempts: number;
  timestamp: number;
  status: string;
  description: string;
}

export const ErrorReportsManager: React.FC = () => {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadReports = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'errorReports'),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        const reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ErrorReport));
        setReports(reportsData);
      } catch (error: any) {
        console.error('Error loading error reports:', error);
        toast.error('Không thể tải báo cáo lỗi');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [user]);

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleResolve = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'errorReports', reportId), {
        status: 'resolved',
        resolvedAt: Date.now()
      });
      setReports(reports.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      toast.success('Đã đánh dấu là đã xử lý');
    } catch (error: any) {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Báo Cáo Lỗi" icon={<XIcon />} />
        <div className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tải...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader title="Tổng Báo Cáo" icon={<XIcon />} />
          <div className="p-6">
            <div className="text-3xl font-bold text-primary-400 mb-2">
              {reports.length}
            </div>
            <p className="text-sm text-gray-400">Tổng số báo cáo lỗi</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Chờ Xử Lý" icon={<XIcon />} />
          <div className="p-6">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {reports.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-sm text-gray-400">Báo cáo chưa xử lý</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Đã Xử Lý" icon={<XIcon />} />
          <div className="p-6">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {reports.filter(r => r.status === 'resolved').length}
            </div>
            <p className="text-sm text-gray-400">Báo cáo đã xử lý</p>
          </div>
        </Card>
      </div>

      {/* Reports List */}
              <Card>
          <CardHeader title="Danh Sách Báo Cáo Lỗi" icon={<XIcon />} />
        <div className="p-6">
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <XIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Không có báo cáo lỗi nào</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {reports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass p-4 rounded-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Failed Image */}
                      {report.failedImageUrl && (
                        <div className="relative group">
                          <img 
                            src={report.failedImageUrl} 
                            alt="Failed check-in"
                            className="w-24 h-24 rounded-lg object-cover border border-red-500/30 cursor-pointer hover:border-red-500/50 transition"
                            onClick={() => window.open(report.failedImageUrl, '_blank')}
                          />
                          <div className="absolute inset-0 bg-red-500/20 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-white">{report.username}</span>
                          <span className="text-sm text-gray-400">
                            {report.department} • {report.position}
                          </span>
                        </div>
                        
                        <p className="text-white mb-2">{report.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span><strong>Loại:</strong> {report.type}</span>
                          <span><strong>Số lần thử:</strong> {report.attempts}</span>
                          <span><strong>Thời gian:</strong> {formatDate(report.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={report.status === 'pending' ? 'warning' : 'success'} />
                      {report.status === 'pending' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleResolve(report.id)}
                        >
                          Đã Xử Lý
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
