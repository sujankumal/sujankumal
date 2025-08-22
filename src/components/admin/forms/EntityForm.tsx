"use client";

import { useState, useEffect } from "react";
import { FormField } from "../FormField";
import { LoadingSpinner } from "../LoadingSpinner";

interface EntityFormProps {
  entity: string;
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormConfig {
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: Array<{ value: string | number; label: string }>;
    rows?: number;
  }>;
}

const entityConfigs: Record<string, FormConfig> = {
  post: {
    fields: [
      { name: "title", label: "Title", type: "text", required: true, placeholder: "Enter post title" },
      { name: "description", label: "Description", type: "textarea", placeholder: "Enter post description", rows: 4 },
      { name: "main_image", label: "Main Image URL", type: "text", required: true, placeholder: "https://example.com/image.jpg" },
      { name: "main_image_credit", label: "Image Credit", type: "text", placeholder: "Photo by..." },
      { name: "date", label: "Date", type: "datetime-local", required: true },
      { name: "published", label: "Published", type: "checkbox" },
    ],
  },
  category: {
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "Enter category name" },
    ],
  },
  user: {
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "Enter user name" },
      { name: "email", label: "Email", type: "email", required: true, placeholder: "user@example.com" },
      { name: "verified", label: "Verified", type: "checkbox" },
      { name: "image", label: "Profile Image URL", type: "text", placeholder: "https://example.com/avatar.jpg" },
    ],
  },
  profile: {
    fields: [
      { name: "authorId", label: "Author ID", type: "number", required: true, placeholder: "Enter user ID" },
      { name: "status", label: "Status", type: "text", placeholder: "Enter status" },
      { name: "image", label: "Profile Image URL", type: "text", placeholder: "https://example.com/profile.jpg" },
      { name: "about", label: "About", type: "textarea", placeholder: "Tell us about yourself...", rows: 4 },
      { name: "phone", label: "Phone", type: "text", placeholder: "+1234567890" },
      { name: "email", label: "Email", type: "email", placeholder: "contact@example.com" },
    ],
  },
  project: {
    fields: [
      { name: "title", label: "Title", type: "text", required: true, placeholder: "Enter project title" },
      { name: "description", label: "Description", type: "textarea", placeholder: "Describe your project...", rows: 4 },
      { name: "link", label: "Link", type: "text", placeholder: "https://github.com/username/project" },
    ],
  },
  social: {
    fields: [
      { name: "name", label: "Platform Name", type: "text", required: true, placeholder: "Twitter, LinkedIn, etc." },
      { name: "username", label: "Username", type: "text", required: true, placeholder: "@username" },
      { name: "embed", label: "Embed", type: "checkbox" },
    ],
  },
  updates: {
    fields: [
      { name: "title", label: "Title", type: "text", required: true, placeholder: "Enter update title" },
      { name: "update", label: "Update Content", type: "textarea", required: true, placeholder: "What's new?", rows: 4 },
      { name: "date", label: "Date", type: "datetime-local" },
    ],
  },
  site: {
    fields: [
      { name: "header_image", label: "Header Image", type: "text", placeholder: "header.jpg" },
      { name: "header_image_credit", label: "Header Image Credit", type: "text", placeholder: "Photo credit..." },
      { name: "title", label: "Site Title", type: "text", required: true, placeholder: "My Website" },
      { name: "name", label: "Site Name", type: "text", required: true, placeholder: "John Doe" },
      { name: "motto", label: "Motto", type: "text", required: true, placeholder: "Your motto here" },
      { name: "greeting", label: "Greeting", type: "text", required: true, placeholder: "Welcome message" },
      { name: "description", label: "Description", type: "textarea", required: true, placeholder: "Site description...", rows: 3 },
      { name: "detail", label: "Detail", type: "textarea", required: true, placeholder: "Detailed information...", rows: 4 },
      { name: "copyright", label: "Copyright", type: "text", required: true, placeholder: "© 2024 Your Name" },
      { name: "year", label: "Year", type: "number", required: true },
      { name: "privacy_policy", label: "Privacy Policy", type: "textarea", placeholder: "Privacy policy content...", rows: 4 },
      { name: "contact_email", label: "Contact Email", type: "email", placeholder: "contact@example.com" },
      { name: "contact_phone", label: "Contact Phone", type: "text", placeholder: "+1234567890" },
    ],
  },
  content: {
    fields: [
      { name: "type", label: "Content Type", type: "select", required: true, options: [
        { value: "text", label: "Text" },
        { value: "markdown", label: "Markdown" },
        { value: "html", label: "HTML" },
        { value: "code", label: "Code" },
        { value: "image", label: "Image" },
        { value: "video", label: "Video" },
      ]},
      { name: "content", label: "Content", type: "textarea", required: true, placeholder: "Enter content here...", rows: 6 },
      { name: "sequence", label: "Sequence", type: "number", required: true, placeholder: "0" },
      { name: "postId", label: "Post ID", type: "number", required: true, placeholder: "Enter post ID" },
    ],
  },
  categoriesOnPosts: {
    fields: [
      { name: "postId", label: "Post", type: "select", required: true },
      { name: "categoryId", label: "Category", type: "select", required: true },
    ],
  },
};

export function EntityForm({ entity, initialData, onSubmit, onCancel, isLoading = false }: EntityFormProps) {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [relationData, setRelationData] = useState<any>({});
  const [loadingRelations, setLoadingRelations] = useState(false);

  const config = entityConfigs[entity];

  // Fetch relation data for dropdowns
  useEffect(() => {
    const fetchRelationData = async () => {
      if (!config) return;

      // Check if entity has foreign key fields
      const hasForeignKeys = config.fields.some(field =>
        field.type === "select" && !field.options &&
        (field.name.endsWith("Id") || field.name === "postId" || field.name === "categoryId")
      );

      if (hasForeignKeys) {
        setLoadingRelations(true);
        try {
          const response = await fetch(`/api/admin/relations?entity=${entity}`);
          if (response.ok) {
            const data = await response.json();
            setRelationData(data);
          }
        } catch (error) {
          console.error("Failed to fetch relation data:", error);
        } finally {
          setLoadingRelations(false);
        }
      }
    };

    fetchRelationData();
  }, [entity, config]);

  useEffect(() => {
    if (initialData) {
      const processedData = { ...initialData };

      // Convert dates to datetime-local format
      config?.fields.forEach(field => {
        if (field.type === "datetime-local" && processedData[field.name]) {
          const date = new Date(processedData[field.name]);
          processedData[field.name] = date.toISOString().slice(0, 16);
        }
      });

      setFormData(processedData);
    } else {
      // Set default values
      const defaultData: any = {};
      config?.fields.forEach(field => {
        if (field.type === "checkbox") {
          defaultData[field.name] = false;
        } else if (field.type === "datetime-local") {
          defaultData[field.name] = new Date().toISOString().slice(0, 16);
        } else if (field.name === "year") {
          defaultData[field.name] = new Date().getFullYear();
        }
      });
      setFormData(defaultData);
    }
  }, [initialData, entity, config]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    config?.fields.forEach(field => {
      if (field.required && (!formData[field.name] || formData[field.name] === "")) {
        newErrors[field.name] = `${field.label} is required`;
      }
      
      // Email validation
      if (field.type === "email" && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = "Please enter a valid email address";
        }
      }
      
      // URL validation for image fields
      if ((field.name.includes("image") || field.name === "link") && formData[field.name]) {
        try {
          // new URL(formData[field.name]);
        } catch {
          newErrors[field.name] = "Please enter a valid URL";
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  if (!config) {
    return <div className="text-red-600">Unknown entity type: {entity}</div>;
  }

  // Get options for a field (either static or from relation data)
  const getFieldOptions = (field: any) => {
    if (field.options) {
      return field.options;
    }

    // Handle foreign key dropdowns
    if (field.type === "select" && relationData) {
      switch (field.name) {
        case "postId":
          return relationData.posts?.map((post: any) => ({
            value: post.id,
            label: `${post.title} (ID: ${post.id})`
          })) || [];
        case "categoryId":
          return relationData.categories?.map((category: any) => ({
            value: category.id,
            label: category.name
          })) || [];
        case "authorId":
          return relationData.authors?.map((author: any) => ({
            value: author.id,
            label: `${author.name} (${author.email})`
          })) || [];
        default:
          return [];
      }
    }

    return [];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {loadingRelations && (
        <div className="text-center py-4">
          <div className="inline-flex items-center text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-600 rounded-full animate-spin mr-2"></div>
            Loading form options...
          </div>
        </div>
      )}

      {config.fields.map((field) => (
        <FormField
          key={field.name}
          label={field.label}
          name={field.name}
          type={field.type as any}
          value={formData[field.name]}
          onChange={(value) => handleFieldChange(field.name, value)}
          error={errors[field.name]}
          required={field.required}
          placeholder={field.placeholder}
          options={getFieldOptions(field)}
          rows={field.rows}
          disabled={isLoading || loadingRelations}
        />
      ))}
      
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
          {initialData ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
