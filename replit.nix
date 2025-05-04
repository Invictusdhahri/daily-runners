{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.nodePackages.typescript
    pkgs.yarn
    pkgs.replitPackages.jest
    pkgs.libuuid
    pkgs.libGL
    pkgs.cairo
    pkgs.pango
    pkgs.pkg-config
    pkgs.libjpeg
    pkgs.giflib
    pkgs.librsvg
    pkgs.pixman
  ];
} 