import { Button } from "@/shared/components/ui/Button";
import { ArrowLeft, Mail, MapPin, Calendar, Star } from "lucide-react";

interface Talent {
  id: string;
  image_url: string;
  name: string;
  skills: string[];
  experience_years: number;
  availability: boolean;
}

interface TalentPortfolioProps {
  talent: Talent;
  onBack: () => void;
}

export function TalentPortfolio({ talent, onBack }: TalentPortfolioProps) {
  return (
    <div className="h-full bg-white rounded-3xl p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="rounded-full w-10 h-10 p-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-semibold text-gray-900">Talent Portfolio</h2>
      </div>

      {/* Profile Section */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-full md:w-1/3">
          <img
            src={talent.image_url || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60'}
            alt={talent.name}
            className="w-full aspect-square object-cover rounded-2xl"
          />
        </div>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{talent.name}</h1>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{talent.experience_years} years experience</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>Remote</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= 4 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">4.8 (127 reviews)</span>
          </div>

          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            talent.availability 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {talent.availability ? 'Available' : 'Not Available'}
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills & Expertise</h3>
        <div className="flex flex-wrap gap-2">
          {talent.skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
        <p className="text-gray-600 leading-relaxed">
          Experienced professional with {talent.experience_years} years in the industry. 
          Passionate about delivering high-quality work and collaborating with teams to achieve exceptional results. 
          Known for strong problem-solving skills and attention to detail.
        </p>
      </div>

      {/* Portfolio Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Portfolio</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="aspect-video bg-gray-100 rounded-lg overflow-hidden group cursor-pointer"
            >
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:opacity-80 transition-opacity">
                <span className="text-blue-600 font-medium">Project {item}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="border-t pt-6">
        <div className="flex gap-3">
          <Button className="flex-1 bg-gradient-to-br from-blue-800 to-blue-400 text-white">
            <Mail className="w-4 h-4 mr-2" />
            Contact Talent
          </Button>
          <Button variant="outline" className="flex-1">
            Schedule Interview
          </Button>
        </div>
      </div>
    </div>
  );
}
