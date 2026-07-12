import { adminEntities } from "@/config/entities";

export type AdminEntityKey = keyof typeof adminEntities;

export function isAdminEntity(entity: string): entity is AdminEntityKey {
    return entity in adminEntities;
}

export function getEntityConfig(entity: string) {
    console.log("entity config", entity);
    if (!isAdminEntity(entity)) {
        return null;
    }
    return adminEntities[entity];
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