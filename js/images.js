/* Corridor cover imagery (licensed stock) + illustratives for package cards/detail.
   Builder flyer photos drop in later per package via `p.img` — card/detail prefer p.img first. */
window.PKG_IMG = {
  corridor: {
    "Geelong": "images/corridor-geelong.jpg",
    "Melbourne West": "images/corridor-west.jpg",
    "Melbourne North": "images/corridor-north.jpg",
    "Melbourne South-East": "images/corridor-southeast.jpg",
    "Regional Victoria": "images/corridor-regional.jpg",
    "Bendigo": "images/corridor-bendigo.jpg"
  },
  houseA: "images/house-b.jpg",
  houseB: "images/corridor-southeast.jpg"
};
window.pkgImg = function (p) {
  if (!p) return "";
  if (p.img) return p.img;
  return (window.PKG_IMG.corridor[p.area] || "");
};
