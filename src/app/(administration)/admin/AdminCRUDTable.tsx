"use client";

import { AdminCRUDTable } from "../../../components/admin/AdminCRUDTable";

interface AdminCRUDTableWrapperProps {
  title: string;
  entity: string;
  fields: string[];
  markdownFields?: string[];
  imageFields?: string[];
  searchableFields?: string[];
  initialData?: any[];
}

export function AdminCRUDTableWrapper(props: AdminCRUDTableWrapperProps) {
  return <AdminCRUDTable {...props} />;
}
