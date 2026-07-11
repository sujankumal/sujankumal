export const adminEntities = {
    posts: {
        title: "Posts",

        columns: [
            {
                field: "title",
                label: "Title",
                type: "text",
                sortable: true
            },
            {
                field: "published",
                type: "boolean"
            },
            {
                field: "author",
                type: "relation",
                display: "name"
            },
            {
                field: "categories",
                type: "manyToMany",
                display: "name"
            },
            {
                field: "main_image",
                type: "image"
            }
        ]
    }
}