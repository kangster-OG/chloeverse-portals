import bpy
import math
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
        mod.profile = 0.65
    bpy.ops.object.shade_smooth()
    return obj


def make_plane(name, size_x, size_y, location, rotation=(0.0, 0.0, 0.0)):
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size_x * 0.5, size_y * 0.5, 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return obj


def main():
    blend_path = arg_value("--blend", os.path.join("art", "blender", "collabs.blend"))

    if os.path.exists(blend_path):
        bpy.ops.wm.open_mainfile(filepath=blend_path)
    else:
        bpy.ops.wm.read_factory_settings(use_empty=True)

    ensure_scene_defaults()

    col = ensure_collection("HOME_EXPORT")
    clear_collection(col)

    objs = []
    objs.append(make_box("HOME_FLOOR", (13.0, 11.0, 0.35), (0.0, 0.0, -0.175), bevel=0.05))
    objs.append(make_box("HOME_BACK_WALL", (12.2, 0.32, 4.8), (0.0, -5.2, 2.2), bevel=0.04))
    objs.append(make_box("HOME_LEFT_WALL", (0.32, 10.6, 4.8), (-6.1, 0.0, 2.2), bevel=0.04))
    objs.append(make_box("HOME_RIGHT_WALL", (0.32, 10.6, 4.8), (6.1, 0.0, 2.2), bevel=0.04))
    objs.append(make_box("HOME_CEILING", (12.5, 10.5, 0.24), (0.0, 0.0, 4.72), bevel=0.03))

    objs.append(make_box("HOME_SCULPT_PLINTH_A", (1.15, 1.15, 1.2), (-2.25, -0.8, 0.6), bevel=0.03))
    objs.append(make_box("HOME_SCULPT_PLINTH_B", (1.25, 1.25, 1.35), (0.0, -1.45, 0.675), bevel=0.03))
    objs.append(make_box("HOME_SCULPT_PLINTH_C", (1.0, 1.0, 1.0), (2.2, -0.55, 0.5), bevel=0.03))

    water = make_plane(
        "WATER_PLANE",
        8.8,
        5.2,
        (0.0, -0.1, 0.02),
        rotation=(math.radians(0.0), 0.0, 0.0),
    )
    objs.append(water)

    for obj in objs:
        link_to_collection(obj, col)

    os.makedirs(os.path.dirname(blend_path), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"Saved HOME blockout to {blend_path}")


if __name__ == "__main__":
    main()
