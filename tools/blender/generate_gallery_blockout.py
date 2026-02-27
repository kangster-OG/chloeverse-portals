import bpy
import os
import sys


ANCHOR_NAMES = [
    "ANCHOR_FRAME_01",
    "ANCHOR_FRAME_02",
    "ANCHOR_FRAME_03",
    "ANCHOR_FRAME_04",
    "ANCHOR_FRAME_05",
]


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


def ensure_scene_defaults():
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0


def ensure_collection(name):
    col = bpy.data.collections.get(name)
    if not col:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    return col


def clear_collection(col):
    for obj in list(col.objects):
        bpy.data.objects.remove(obj, do_unlink=True)


def link_to_collection(obj, col):
    if obj.name not in col.objects:
        col.objects.link(obj)
    for parent in list(obj.users_collection):
        if parent != col:
            parent.objects.unlink(obj)


def make_box(name, size, location, bevel=0.03):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size[0] * 0.5, size[1] * 0.5, size[2] * 0.5)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        mod = obj.modifiers.new(name="Bevel", type="BEVEL")
        mod.width = bevel
        mod.segments = 2
        mod.profile = 0.68
    bpy.ops.object.shade_smooth()
    return obj


def make_empty(name, location):
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = "PLAIN_AXES"
    obj.empty_display_size = 0.28
    obj.location = location
    bpy.context.scene.collection.objects.link(obj)
    return obj


def main():
    blend_path = arg_value("--blend", os.path.join("art", "blender", "collabs.blend"))

    if os.path.exists(blend_path):
        bpy.ops.wm.open_mainfile(filepath=blend_path)
    else:
        bpy.ops.wm.read_factory_settings(use_empty=True)

    ensure_scene_defaults()

    col = ensure_collection("GALLERY_EXPORT")
    clear_collection(col)

    objs = []
    objs.append(make_box("GALLERY_FLOOR", (8.8, 21.5, 0.3), (0.0, -8.8, -0.15), bevel=0.03))
    objs.append(make_box("GALLERY_LEFT_WALL", (0.28, 21.2, 4.4), (-4.35, -8.8, 2.05), bevel=0.03))
    objs.append(make_box("GALLERY_RIGHT_WALL", (0.28, 21.2, 4.4), (4.35, -8.8, 2.05), bevel=0.03))
    objs.append(make_box("GALLERY_BACK_WALL", (8.5, 0.26, 4.4), (0.0, -19.25, 2.05), bevel=0.03))
    objs.append(make_box("GALLERY_CEILING", (8.6, 20.8, 0.22), (0.0, -8.8, 4.22), bevel=0.02))

    accent = make_box("GALLERY_LIGHT_TRAY", (2.8, 0.45, 0.14), (0.0, -2.3, 3.9), bevel=0.01)
    objs.append(accent)

    anchor_positions = [
        (-2.8, -3.6, 1.55),
        (2.8, -6.8, 1.55),
        (-2.8, -10.2, 1.55),
        (2.8, -13.6, 1.55),
        (0.0, -17.0, 1.55),
    ]

    for name, pos in zip(ANCHOR_NAMES, anchor_positions):
        anchor = make_empty(name, pos)
        objs.append(anchor)

    for obj in objs:
        link_to_collection(obj, col)

    os.makedirs(os.path.dirname(blend_path), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"Saved GALLERY blockout to {blend_path}")


if __name__ == "__main__":
    main()
