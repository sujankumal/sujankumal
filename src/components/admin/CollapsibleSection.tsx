"use client";

import { useState, ReactNode } from "react";
import { ChevronDown, ChevronRight, Database, Users, FileText, Settings, Link, MessageSquare, Calendar, Layers } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  entity: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  onExpand?: () => void;
  isLoading?: boolean;
}

const entityIcons: Record<string, ReactNode> = {
  post: <FileText className="h-5 w-5" />,
  category: <Layers className="h-5 w-5" />,
  user: <Users className="h-5 w-5" />,
  profile: <Users className="h-5 w-5" />,
  project: <Database className="h-5 w-5" />,
  social: <Link className="h-5 w-5" />,
  updates: <MessageSquare className="h-5 w-5" />,
  site: <Settings className="h-5 w-5" />,
  content: <FileText className="h-5 w-5" />,
  categoriesOnPosts: <Layers className="h-5 w-5" />,
  account: <Users className="h-5 w-5" />,
  session: <Calendar className="h-5 w-5" />,
  verificationToken: <Calendar className="h-5 w-5" />,
};

const entityDescriptions: Record<string, string> = {
  post: "Manage blog posts, articles, and content with images and categories",
  category: "Organize content into categories and manage taxonomies",
  user: "Manage user accounts, authentication, and permissions",
  profile: "User profile information, bio, contact details, and settings",
  project: "Portfolio projects, work samples, and project descriptions",
  social: "Social media links, profiles, and external connections",
  updates: "Site announcements, news, and update notifications",
  site: "Global site settings, configuration, and metadata",
  content: "Individual content blocks and components within posts",
  categoriesOnPosts: "Relationships between posts and their assigned categories",
  account: "OAuth accounts and authentication provider connections",
  session: "Active user sessions and authentication tokens",
  verificationToken: "Email verification and password reset tokens",
};

export function CollapsibleSection({
  title,
  entity,
  description,
  icon,
  children,
  defaultExpanded = false,
  onExpand,
  isLoading = false,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    if (!isExpanded && onExpand) {
      onExpand();
    }
    setIsExpanded(!isExpanded);
  };

  const displayIcon = icon || entityIcons[entity] || <Database className="h-5 w-5" />;
  const displayDescription = description || entityDescriptions[entity] || `Manage ${entity} data`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-inset"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="text-teal-600">
              {displayIcon}
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600 mt-1">{displayDescription}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin"></div>
          )}
          <div className="text-gray-400">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </div>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {isLoading ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-flex items-center space-x-2 text-gray-600">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin"></div>
                <span>Loading {title.toLowerCase()}...</span>
              </div>
            </div>
          ) : (
            <div className="p-0">
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CollapsibleSectionGroupProps {
  title: string;
  description?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export function CollapsibleSectionGroup({
  title,
  description,
  children,
  defaultExpanded = false,
}: CollapsibleSectionGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left mb-4 group focus:outline-none"
      >
        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200 hover:from-teal-100 hover:to-blue-100 transition-all duration-200">
          <div className="text-teal-600">
            {isExpanded ? (
              <ChevronDown className="h-6 w-6" />
            ) : (
              <ChevronRight className="h-6 w-6" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-6">
          {children}
        </div>
      )}
    </div>
  );
}
