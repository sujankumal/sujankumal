import { adminEntities } from "@/config/entities";
import { AdminEntity, AdminFilterField, AdminFormField } from "@/config/types";

export type AdminEntityKey = keyof typeof adminEntities;

export function isAdminEntity(entity: string): entity is AdminEntityKey {
    return entity in adminEntities;
}

export function getEntityConfig(entity: string): AdminEntity | null {
    if (!isAdminEntity(entity)) {
        return null;
    }
    return adminEntities[entity];
}

function mapFormFieldToFilter(field: AdminFormField): AdminFilterField | null {
    switch (field.control) {
        case "number":
            return { field: field.name, label: field.label, type: "number" };
        case "date":
        case "datetime-local":
            return { field: field.name, label: field.label, type: "date" };
        case "boolean":
        case "checkbox":
            return { field: field.name, label: field.label, type: "boolean" };
        case "select":
            return { field: field.name, label: field.label, type: "select", options: field.options };
        case "text":
        case "textarea":
        case "markdown":
        case "email":
        case "url":
        case "password":
            return { field: field.name, label: field.label, type: "text" };
        default:
            return null;
    }
}

export function getFilterFields(entity: string): AdminFilterField[] {
    const config = getEntityConfig(entity);
    if (!config) {
        return [];
    }

    if (config.filters && config.filters.length > 0) {
        return config.filters;
    }

    return config.form
        .map(mapFormFieldToFilter)
        .filter((filter): filter is AdminFilterField => filter !== null);
}

export function normalizeData(data: Record<string, any>) {
    const result = { ...data };
    Object.keys(result).forEach((key) => {
        if (result[key] === "") {
            result[key] = null;
        }
    });
    return result;
}