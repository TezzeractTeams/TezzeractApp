import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Users, Briefcase, UserPlus } from 'lucide-react';

export default function TalentPage() {
  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Talent Search</h1>
          <p className="text-gray-600 mt-1">Manage candidates, jobs, and applications</p>
        </div>
        <Button variant="gradient">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Candidate
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Total Candidates</CardTitle>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">1,247</p>
            <p className="text-sm text-green-600 mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Active Jobs</CardTitle>
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">23</p>
            <p className="text-sm text-blue-600 mt-1">5 new this week</p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Applications</CardTitle>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">456</p>
            <p className="text-sm text-yellow-600 mt-1">89 pending review</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Candidates */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Candidates</CardTitle>
          <CardDescription>Latest candidates added to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'John Doe', role: 'Senior Developer', skills: 'React, Node.js, TypeScript' },
              { name: 'Jane Smith', role: 'Product Manager', skills: 'Agile, Scrum, Product Strategy' },
              { name: 'Mike Johnson', role: 'UX Designer', skills: 'Figma, User Research, Prototyping' },
            ].map((candidate, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                    {candidate.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{candidate.name}</p>
                    <p className="text-sm text-gray-600">{candidate.role}</p>
                    <p className="text-xs text-gray-500 mt-1">{candidate.skills}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">View Profile</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

