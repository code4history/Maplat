import Swiper from "swiper";

Swiper.prototype.slideToMapID = function (mapID: string) {
  const slide = this.$el[0].querySelector(".swiper-slide-active");
  if (slide && slide.getAttribute("data") == mapID) return;

  const sliders = this.$el[0].querySelectorAll(".swiper-slide");
  for (let i = 0; i < sliders.length; i++) {
    const slider = sliders[i];
    if (slider.getAttribute("data") == mapID) {
      return this.slideToLoop(
        parseInt(slider.getAttribute("data-swiper-slide-index") || "0")
      );
    }
  }
};

Swiper.prototype.slideToIndex = function (index: number) {
  const slide = this.$el[0].querySelector(".swiper-slide-active");
  if (
    slide &&
    parseInt(slide.getAttribute("data-swiper-slide-index") || "0") == index
  )
    return;

  this.slideToLoop(index);
};

Swiper.prototype.setSlideMapID = function (mapID: string) {
  this.slideToMapID(mapID);
  this.setSlideMapIDAsSelected(mapID);
};

Swiper.prototype.setSlideIndex = function (index: number) {
  this.slideToIndex(index);
  this.setSlideIndexAsSelected(index);
};

Swiper.prototype.setSlideIndexAsSelected = function (index: number) {
  const sliders = this.$el[0].querySelectorAll(".swiper-slide");
  for (let i = 0; i < sliders.length; i++) {
    const slider = sliders[i];
    if (slider.getAttribute("data-swiper-slide-index") == index.toString()) {
      slider.classList.add("selected");
    } else {
      slider.classList.remove("selected");
    }
  }
};

Swiper.prototype.setSlideMapIDAsSelected = function (mapID: string) {
  const sliders = this.$el[0].querySelectorAll(".swiper-slide");
  for (let i = 0; i < sliders.length; i++) {
    const slider = sliders[i];
    if (slider.getAttribute("data") == mapID) {
      slider.classList.add("selected");
    } else {
      slider.classList.remove("selected");
    }
  }
};

export { Swiper };
