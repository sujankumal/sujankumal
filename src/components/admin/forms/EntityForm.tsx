"use client";

import { useState, useEffect } from "react";
import { FormField } from "../FormField";
import { LoadingSpinner } from "../LoadingSpinner";
import { AdminFormField } from "@/config/types";
import { getEntityConfig } from "@/config/entity-config";

interface EntityFormProps {
  entity: string;
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

type RelationData = Record<string, any[]>;
type FormDataState = Record<string, any>;

export function EntityForm({ entity, initialData, onSubmit, onCancel, isLoading = false }: EntityFormProps) {
  const [formData, setFormData] = useState<FormDataState>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [relationData, setRelationData] = useState<RelationData>({});
  const [loadingRelations, setLoadingRelations] = useState(false);

  const config = getEntityConfig(entity);

  // Fetch relation data for dropdowns
  useEffect(() => {
    const fetchRelationData = async () => {
      if (!config) return;

      const relationEntities = config.form
        .filter(field => field.control === "relation")
        .map(field => field.relation?.entity);
      const uniqueRelations = [...new Set(relationEntities)];

      // Check if entity has foreign key fields
      const hasRelations = config.form.some(
        field => field.control === "relation"
      );

      if (hasRelations) {
        setLoadingRelations(true);
        try {
          const response = await fetch(`/api/admin/relations?entity=${uniqueRelations.join(",")}`);
          if (response.ok) {
            const data = await response.json();
            setRelationData(data);
          }
        } catch (error) {

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
      config?.form.forEach(field => {
        if (field.control === "date" && processedData[field.name]) {
          const date = new Date(processedData[field.name]);
          processedData[field.name] = date.toISOString().slice(0, 16);
        }
        if (
          field.control === "relation" &&
          field.relation
        ) {
          const relationName = field.name.replace(/Id$/, "");

          if (
            processedData[field.name] == null &&
            processedData[relationName]
          ) {
            processedData[field.name] =
              processedData[relationName].id;
          }
        }
      });

      setFormData(processedData);
    } else {
      // Set default values
      const defaultData: any = {};
      config?.form.forEach(field => {
        if (field.control === "boolean") {
          defaultData[field.name] = false;
        } else if (field.control === "date") {
          defaultData[field.name] = new Date().toISOString().slice(0, 16);
        } else if (field.control === "number") {
          defaultData[field.name] = new Date().getFullYear();
        }
      });
      setFormData(defaultData);
    }
  }, [initialData, entity, config]);

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev: any) => ({ ...prev, [fieldName]: value }));

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    config?.form.forEach(field => {
      if (field.required && (!formData[field.name] || formData[field.name] === "")) {
        newErrors[field.name] = `${field.label} is required`;
      }

      // Email validation
      if (field.control === "email" && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = "Please enter a valid email address";
        }
      }

      // URL validation for image fields
      if ((field.control === "image" || field.control === "url") && formData[field.name]) {
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

    }
  };

  if (!config) {
    return <div className="text-red-600">Unknown entity type: {entity}</div>;
  }

  // Get options for a field (either static or from relation data)
  const getFieldOptions = (field: AdminFormField) => {
    if (field.options) {
      return field.options;
    }

    // Handle foreign key dropdowns
    if (field.control === "relation" && field.relation && relationData[field.relation.entity]) {
      return relationData[field.relation.entity].map((item: any) => ({
        value: item[field.relation?.value ?? "id"],
        label: item[field.relation?.label ?? "name"],
      }));
    }

    return [];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {loadingRelations && (
        <div className="text-center py-4">
          <div className="inline-flex items-center text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin mr-2"></div>
            Loading form options...
          </div>
        </div>
      )}

      {config.form.map((field) => (
        <FormField
          key={field.name}
          label={field.label}
          name={field.name}
          type={field.control}
          value={formData[field.name]}
          onChange={(value) => handleFieldChange(field.name, value)}
          error={errors[field.name]}
          required={field.required}
          placeholder={field.placeholder}
          options={getFieldOptions(field)}
          disabled={isLoading || loadingRelations}
        />
      ))}

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
          {initialData ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}
