import bpy
import os
import sys


def arg_value(flag, default=None):
    argv = sys.argv
    if "--" not in argv:
        return default
    args = argv[argv.index("--") + 1 :]
    if flag in args:
        i = args.index(flag)
        if i + 1 < len(args):
            return args[i + 1]
    return default


def select_collection_objects(collection_name):
    col = bpy.data.collections.get(collection_name)
    if not col:
        raise RuntimeError(f"Collection not found: {collection_name}")

    bpy.ops.object.select_all(action="DESELECT")

    def walk(col):
        for obj in col.objects:
            obj.select_set(True)
        for child in col.children:
            walk(child)

    walk(col)


def export_collection(collection_name, output_path):
    select_collection_objects(collection_name)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
    )
    print(f"Exported {collection_name} -> {output_path}")


def main():
    blend_path = arg_value("--blend", os.path.join("art", "blender", "collabs.blend"))
    home_out = arg_value("--home", os.path.join("public", "assets", "models", "collabs", "home.glb"))
    gallery_out = arg_value("--gallery", os.path.join("public", "assets", "models", "collabs", "gallery.glb"))

    if not os.path.exists(blend_path):
        raise RuntimeError(f"Blend file not found: {blend_path}")

    bpy.ops.wm.open_mainfile(filepath=blend_path)

    export_collection("HOME_EXPORT", home_out)
    export_collection("GALLERY_EXPORT", gallery_out)


if __name__ == "__main__":
    main()