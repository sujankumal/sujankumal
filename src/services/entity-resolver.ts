import { NextResponse } from "next/server";
import { getEntityConfig } from "@/config/entity-config";
import { getEntityModel, getServerConfig } from "@/config/entity-server";

export async function resolveEntity(entity: string) {
    const config = getEntityConfig(entity);
    const serverConfig = await getServerConfig(entity);

    if (!config) {
        return NextResponse.json(
            { error: "Invalid entity" },
            { status: 400 }
        );
    }

    const model = await getEntityModel(entity);

    if (!model) {
        return NextResponse.json(
            { error: "Invalid entity" },
            { status: 400 }
        );
    }

    return {
        config,
        model,
        serverConfig
    };
}