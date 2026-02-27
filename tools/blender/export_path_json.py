import bpy
import json
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


def main():
    blend_path = arg_value("--blend", os.path.join("art", "blender", "collabs.blend"))
    out_path = arg_value("--out", os.path.join("public", "assets", "models", "collabs", "path_home_to_gallery.json"))

    if not os.path.exists(blend_path):
        raise RuntimeError(f"Blend file not found: {blend_path}")

    bpy.ops.wm.open_mainfile(filepath=blend_path)

    curve_obj = bpy.data.objects.get("PATH_HOME_TO_GALLERY")
    if not curve_obj or curve_obj.type != "CURVE":
        print("PATH_HOME_TO_GALLERY not found; skipping JSON export.")
        return

    curve = curve_obj.data
    points = []
    for spline in curve.splines:
        if spline.type == "BEZIER":
            for p in spline.bezier_points:
                co = curve_obj.matrix_world @ p.co
                points.append({"x": co.x, "y": co.y, "z": co.z})
        else:
            for p in spline.points:
                co = curve_obj.matrix_world @ p.co.xyz
                points.append({"x": co.x, "y": co.y, "z": co.z})

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({"name": "PATH_HOME_TO_GALLERY", "points": points}, f, indent=2)

    print(f"Exported PATH_HOME_TO_GALLERY -> {out_path}")


if __name__ == "__main__":
    main()