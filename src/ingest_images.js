import pointer_core from '../node_modules/@maplat/core/src/pointer_images';
import pointer_ui from './pointer_images';
import freeze from "./freeze_images";

Object.assign(pointer_core, freeze);
Object.assign(pointer_ui, freeze);

export default pointer_ui;
