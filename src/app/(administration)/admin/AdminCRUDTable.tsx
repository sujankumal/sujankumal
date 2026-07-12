"use client";

import { AdminCRUDTable } from "../../../components/admin/AdminCRUDTable";
import { AdminEntities } from "../../../config/entities";

interface AdminCRUDTableWrapperProps {
  title: string;
  entity: keyof AdminEntities;
  fields: string[];
  markdownFields?: string[];
  imageFields?: string[];
  searchableFields?: string[];
  initialData?: any[];
}

export function AdminCRUDTableWrapper(props: AdminCRUDTableWrapperProps) {
  return <AdminCRUDTable {...props} />;
}
