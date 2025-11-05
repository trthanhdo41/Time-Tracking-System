import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Session, User, BackSoonRecord, ActivityLog } from '@/types';

export interface ReportData {
  userId: string;
  username: string;
  department: string;
  position: string;
  totalOnlineTime: number;
  totalBackSoonTime: number;
  totalSessions: number;
  averageSessionTime: number;
  punctualityRate: number;
  backSoonCount: number;
  checkInTime: number;
  checkOutTime?: number;
  date: string;
}

export interface DepartmentReport {
  department: string;
  totalUsers: number;
  totalOnlineTime: number;
  totalBackSoonTime: number;
  averageOnlineTime: number;
  punctualityRate: number;
  userReports: ReportData[];
}

export const generateUserReport = async (
  userId: string,
  startDate: number,
  endDate: number
): Promise<ReportData[]> => {
  try {
    // Get user sessions within date range
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('userId', '==', userId),
      where('checkInTime', '>=', startDate),
      where('checkInTime', '<=', endDate),
      orderBy('checkInTime', 'desc')
    );

    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions: Session[] = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Session));

    // Get user info
    const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
    const user = userDoc.docs[0]?.data() as User;

    if (!user) throw new Error('User not found');

    // Calculate report data
    const reports: ReportData[] = [];
    
    sessions.forEach(session => {
      const totalOnlineTime = session.totalOnlineTime || 0;
      const totalBackSoonTime = session.totalBackSoonTime || 0;
      const sessionDuration = session.checkOutTime ? 
        (session.checkOutTime - session.checkInTime) / 1000 : 0;

      reports.push({
        userId: session.userId,
        username: session.username,
        department: session.department,
        position: session.position,
        totalOnlineTime,
        totalBackSoonTime,
        totalSessions: 1,
        averageSessionTime: sessionDuration,
        punctualityRate: calculatePunctualityRate(session.checkInTime),
        backSoonCount: session.backSoonEvents?.length || 0,
        checkInTime: session.checkInTime,
        checkOutTime: session.checkOutTime,
        date: new Date(session.checkInTime).toISOString().split('T')[0]
      });
    });

    return reports;
  } catch (error) {
    console.error('Error generating user report:', error);
    throw new Error('Unable to create user report');
  }
};

export const generateDepartmentReport = async (
  department: string,
  startDate: number,
  endDate: number
): Promise<DepartmentReport> => {
  try {
    // Get all users in department
    const usersQuery = query(
      collection(db, 'users'),
      where('department', '==', department)
    );
    const usersSnapshot = await getDocs(usersQuery);
    const users: User[] = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));

    // Get all sessions for department users
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('department', '==', department),
      where('checkInTime', '>=', startDate),
      where('checkInTime', '<=', endDate),
      orderBy('checkInTime', 'desc')
    );

    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions: Session[] = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Session));

    // Calculate department statistics
    const totalUsers = users.length;
    const totalOnlineTime = sessions.reduce((sum, session) => 
      sum + (session.totalOnlineTime || 0), 0);
    const totalBackSoonTime = sessions.reduce((sum, session) => 
      sum + (session.totalBackSoonTime || 0), 0);
    const averageOnlineTime = sessions.length > 0 ? 
      totalOnlineTime / sessions.length : 0;
    const punctualityRate = calculateDepartmentPunctualityRate(sessions);

    // Generate individual user reports
    const userReports: ReportData[] = [];
    users.forEach(user => {
      const userSessions = sessions.filter(session => session.userId === user.id);
      const userTotalOnlineTime = userSessions.reduce((sum, session) => 
        sum + (session.totalOnlineTime || 0), 0);
      const userTotalBackSoonTime = userSessions.reduce((sum, session) => 
        sum + (session.totalBackSoonTime || 0), 0);

      if (userSessions.length > 0) {
        userReports.push({
          userId: user.id,
          username: user.username,
          department: user.department,
          position: user.position,
          totalOnlineTime: userTotalOnlineTime,
          totalBackSoonTime: userTotalBackSoonTime,
          totalSessions: userSessions.length,
          averageSessionTime: userTotalOnlineTime / userSessions.length,
          punctualityRate: calculateUserPunctualityRate(userSessions),
          backSoonCount: userSessions.reduce((sum, session) => 
            sum + (session.backSoonEvents?.length || 0), 0),
          checkInTime: userSessions[0]?.checkInTime || 0,
          checkOutTime: userSessions[0]?.checkOutTime,
          date: new Date(userSessions[0]?.checkInTime || 0).toISOString().split('T')[0]
        });
      }
    });

    return {
      department,
      totalUsers,
      totalOnlineTime,
      totalBackSoonTime,
      averageOnlineTime,
      punctualityRate,
      userReports
    };
  } catch (error) {
    console.error('Error generating department report:', error);
    throw new Error('Unable to create department report');
  }
};

export const generateSystemReport = async (
  startDate: number,
  endDate: number
): Promise<{
  totalUsers: number;
  totalOnlineTime: number;
  totalBackSoonTime: number;
  averageOnlineTime: number;
  punctualityRate: number;
  departmentReports: DepartmentReport[];
}> => {
  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users: User[] = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));

    // Get all sessions
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('checkInTime', '>=', startDate),
      where('checkInTime', '<=', endDate),
      orderBy('checkInTime', 'desc')
    );

    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions: Session[] = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Session));

    // Calculate system statistics
    const totalUsers = users.length;
    const totalOnlineTime = sessions.reduce((sum, session) => 
      sum + (session.totalOnlineTime || 0), 0);
    const totalBackSoonTime = sessions.reduce((sum, session) => 
      sum + (session.totalBackSoonTime || 0), 0);
    const averageOnlineTime = sessions.length > 0 ? 
      totalOnlineTime / sessions.length : 0;
    const punctualityRate = calculateDepartmentPunctualityRate(sessions);

    // Get unique departments
    const departments = [...new Set(users.map(user => user.department))];
    
    // Generate department reports
    const departmentReports: DepartmentReport[] = [];
    for (const department of departments) {
      const departmentReport = await generateDepartmentReport(department, startDate, endDate);
      departmentReports.push(departmentReport);
    }

    return {
      totalUsers,
      totalOnlineTime,
      totalBackSoonTime,
      averageOnlineTime,
      punctualityRate,
      departmentReports
    };
  } catch (error) {
    console.error('Error generating system report:', error);
    throw new Error('Unable to create system report');
  }
};

// Helper functions
const calculatePunctualityRate = (checkInTime: number): number => {
  const checkInHour = new Date(checkInTime).getHours();
  const checkInMinute = new Date(checkInTime).getMinutes();
  
  // Consider on-time if check-in before 8:30 AM
  const isOnTime = checkInHour < 8 || (checkInHour === 8 && checkInMinute <= 30);
  return isOnTime ? 100 : 0;
};

const calculateUserPunctualityRate = (sessions: Session[]): number => {
  if (sessions.length === 0) return 0;
  
  const onTimeSessions = sessions.filter(session => 
    calculatePunctualityRate(session.checkInTime) === 100
  );
  
  return (onTimeSessions.length / sessions.length) * 100;
};

const calculateDepartmentPunctualityRate = (sessions: Session[]): number => {
  if (sessions.length === 0) return 0;
  
  const onTimeSessions = sessions.filter(session => 
    calculatePunctualityRate(session.checkInTime) === 100
  );
  
  return (onTimeSessions.length / sessions.length) * 100;
};

export const exportReportToCSV = (reports: ReportData[]): string => {
  const headers = [
    'Employee Name',
    'Department',
    'Position',
    'Total Online Time (seconds)',
    'Total Back Soon Time (seconds)',
    'Number of Work Sessions',
    'Average Time/Session (seconds)',
    'On-Time Rate (%)',
    'Number of Back Soon',
    'Check In Date',
    'Check In Time',
    'Check Out Time'
  ];

  const rows = reports.map(report => [
    report.username,
    report.department,
    report.position,
    report.totalOnlineTime,
    report.totalBackSoonTime,
    report.totalSessions,
    report.averageSessionTime,
    report.punctualityRate.toFixed(2),
    report.backSoonCount,
    report.date,
    new Date(report.checkInTime).toLocaleString('en-US'),
    report.checkOutTime ? new Date(report.checkOutTime).toLocaleString('en-US') : 'Not checked out yet'
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
};
