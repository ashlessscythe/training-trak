import { useState } from "react";
import { TrainingWithRelations } from "@/hooks/useTraining";
import { TrainingStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminTrainingDetailsProps {
  site: {
    id: string;
    name: string;
    code: string;
  };
  trainings: TrainingWithRelations[];
}

export function AdminTrainingDetails({ site, trainings }: AdminTrainingDetailsProps) {
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  // Group trainings by department
  const byDepartment = trainings.reduce((acc, training) => {
    const deptName = training.user.department?.name || "No Department";
    if (!acc[deptName]) {
      acc[deptName] = [];
    }
    acc[deptName].push(training);
    return acc;
  }, {} as Record<string, TrainingWithRelations[]>);

  // Calculate statistics for each department
  const getDeptStats = (deptTrainings: TrainingWithRelations[]) => {
    const total = deptTrainings.length;
    
    const counts = {
      IN_PROGRESS: 0,
      COMPLETED: 0,
      APPROVED: 0,
      REJECTED: 0,
    };
    
    deptTrainings.forEach(training => {
      counts[training.status as keyof typeof counts]++;
    });
    
    return {
      total,
      ...counts,
      percentComplete: total ? Math.round((counts.APPROVED / total) * 100) : 0
    };
  };

  // Get status color class
  const getStatusColor = (status: TrainingStatus) => {
    switch (status) {
      case "APPROVED":
        return "text-green-600";
      case "REJECTED":
        return "text-red-600";
      case "COMPLETED":
        return "text-blue-600";
      default:
        return "text-yellow-600";
    }
  };

  const getStatusText = (status: TrainingStatus) => {
    switch (status) {
      case "APPROVED":
        return "Approved";
      case "REJECTED":
        return "Rejected";
      case "COMPLETED":
        return "Completed (pending approval)";
      case "IN_PROGRESS":
        return "In Progress";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 my-6">
      <h2 className="text-2xl font-bold">
        {site.name} - Training Details by Department
      </h2>
      
      {Object.entries(byDepartment).length === 0 ? (
        <p className="text-muted-foreground">No training data available for this site.</p>
      ) : (
        Object.entries(byDepartment).map(([deptName, deptTrainings]) => {
          const stats = getDeptStats(deptTrainings);
          const isExpanded = expandedDept === deptName;
          
          return (
            <Card key={deptName} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedDept(isExpanded ? null : deptName)}
              >
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{deptName}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm">
                      <span className="font-medium">{stats.APPROVED}</span> of <span>{stats.total}</span> approved
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${stats.percentComplete}%` }}
                      ></div>
                    </div>
                    <span className="text-sm">{stats.percentComplete}%</span>
                    <svg 
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-3 bg-muted/30 rounded-md">
                        <div className="text-sm text-muted-foreground">In Progress</div>
                        <div className={`text-xl font-bold ${getStatusColor("IN_PROGRESS")}`}>{stats.IN_PROGRESS}</div>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-md">
                        <div className="text-sm text-muted-foreground">Completed</div>
                        <div className={`text-xl font-bold ${getStatusColor("COMPLETED")}`}>{stats.COMPLETED}</div>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-md">
                        <div className="text-sm text-muted-foreground">Approved</div>
                        <div className={`text-xl font-bold ${getStatusColor("APPROVED")}`}>{stats.APPROVED}</div>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-md">
                        <div className="text-sm text-muted-foreground">Rejected</div>
                        <div className={`text-xl font-bold ${getStatusColor("REJECTED")}`}>{stats.REJECTED}</div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Trainee Details</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">SOP</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Last Updated</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {deptTrainings.map(training => (
                              <tr key={training.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3 text-sm">{training.user.name}</td>
                                <td className="px-4 py-3 text-sm">
                                  {training.sop.name} <span className="text-xs text-muted-foreground">v{training.sop.version}</span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(training.status)}/10 ${getStatusColor(training.status)}`}>
                                    {getStatusText(training.status)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                  {new Date(training.updatedAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
