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
  if (window.LISTING_IMG && window.LISTING_IMG[p.id]) return window.LISTING_IMG[p.id];
  if (p.img) return p.img;
  if (window.ESTATE_IMG && window.ESTATE_IMG[p.estate]) return window.ESTATE_IMG[p.estate];
  return (window.PKG_IMG.corridor[p.area] || "");
};
