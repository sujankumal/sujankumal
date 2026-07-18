import { z } from "zod";

export type FormControl =
    | "text"
    | "textarea"
    | "markdown"
    | "number"
    | "boolean"
    | "date"
    | "image"
    | "relation"
    | "manyToMany"
    | "select"
    | "email"
    | "url"
    | "password";

export interface RelationConfig {
    entity: string;
    value: string;
    label: string;
}

export interface SelectOption {
    label: string;
    value: string | number | boolean;
}

export interface AdminFormField {
    name: string;
    label: string;
    control: FormControl;
    required?: boolean;
    sortable?: boolean;
    placeholder?: string;
    hidden?: boolean;
    display?: string;
    readonly?: boolean;
    width?: string;
    rows?: number;
    relation?: RelationConfig;
    options?: SelectOption[];
}

export type ColumnRenderer =
    | "text"
    | "number"
    | "boolean"
    | "date"
    | "markdown"
    | "image"
    | "relation"
    | "manyToMany"
    | "tags";

export interface AdminColumn {
    field: string;          // property to read from the object
    label: string;          // column heading
    renderer: ColumnRenderer;
    sortable?: boolean;

    display?: string;  // for relation rendering
    width?: string;
    hidden?: boolean;
}

export interface AdminEntity {
    title: string;
    schema: z.ZodObject<any>;
    columns: AdminColumn[];
    form: AdminFormField[];
    searchable?: (search: string) => Record<string, any>;
    include?: Record<string, any>;
    primaryKey?: string;
    defaultSort?: {
        field: string;
        order: "asc" | "desc";
    };
    sortableFields?: string[];
    beforeCreate?: (data: any) => any | Promise<any>;
    afterCreate?: (created: any) => Promise<void> | void;

    beforeUpdate?: (data: any) => any | Promise<any>;
    afterUpdate?: (updated: any) => Promise<void> | void;

    beforeDelete?: (id: number | string) => Promise<void> | void;
    afterDelete?: (id: number | string) => Promise<void> | void;

    resolveWhere?: (
        input: Record<string, any>,
        prisma: typeof import("@/../prisma/prisma").default
    ) => Promise<Record<string, any>> | Record<string, any>;
}