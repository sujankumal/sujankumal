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
  posts: <FileText className="h-5 w-5" />,
  categories: <Layers className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  profiles: <Users className="h-5 w-5" />,
  projects: <Database className="h-5 w-5" />,
  socials: <Link className="h-5 w-5" />,
  updates: <MessageSquare className="h-5 w-5" />,
  site: <Settings className="h-5 w-5" />,
  content: <FileText className="h-5 w-5" />,
  categoriesonposts: <Layers className="h-5 w-5" />,
  accounts: <Users className="h-5 w-5" />,
  sessions: <Calendar className="h-5 w-5" />,
  verificationtokens: <Calendar className="h-5 w-5" />,
};

const entityDescriptions: Record<string, string> = {
  posts: "Manage blog posts, articles, and content with images and categories",
  categories: "Organize content into categories and manage taxonomies",
  users: "Manage user accounts, authentication, and permissions",
  profiles: "User profile information, bio, contact details, and settings",
  projects: "Portfolio projects, work samples, and project descriptions",
  socials: "Social media links, profiles, and external connections",
  updates: "Site announcements, news, and update notifications",
  site: "Global site settings, configuration, and metadata",
  content: "Individual content blocks and components within posts",
  categoriesonposts: "Relationships between posts and their assigned categories",
  accounts: "OAuth accounts and authentication provider connections",
  sessions: "Active user sessions and authentication tokens",
  verificationtokens: "Email verification and password reset tokens",
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
    <div className="ml-10 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full px-6 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-inset"
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="text-orange-600">
              {displayIcon}
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-600 mt-1">{displayDescription}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin"></div>
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
                <div className="w-6 h-6 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin"></div>
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
        <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-300 to-blue-300 rounded-lg border border-orange-200 hover:from-orange-100 hover:to-blue-100 transition-all duration-200">
          <div className="text-orange-600">
            {isExpanded ? (
              <ChevronDown className="h-6 w-6" />
            ) : (
              <ChevronRight className="h-6 w-6" />
            )}
          </div>
          <div>
            <h2 className="text-sm text-gray-900 group-hover:text-orange-700 transition-colors">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-gray-600 mt-1">{description}</p>
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
