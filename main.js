// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import "@babel/polyfill";
import * as mobilenetModule from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import * as jsonfile from "jsonfile"

import {fs} from 'fs';


// Webcam Image size. Must be 227.
const IMAGE_SIZE = 227;
// K value for KNN
const TOPK = 10;
//Number of Classes Does Not Matter
//IF PETS is EMPTY it will ask you for 2 class names
var PETS = ["Maisy","Jonesy"];
class Main {
  constructor() {
    // Initiate variables
    try {
      this.load();

    } catch (e) {

    } finally {

    }
    this.infoTexts = [];
    this.training = -1; // -1 when no class is being trained
    this.videoPlaying = false;

    // Initiate deeplearn.js math and knn classifier objects
    this.bindPage();

    // Create video element that will contain the webcam image
    this.video = document.createElement('video');
    this.video.setAttribute('autoplay', '');
    this.video.setAttribute('playsinline', '');

    // Add video element to DOM
    const title = document.createElement('h3');
    //title.className='jumbotron';

    title.innerText = "Pet Recognition AI Trainer ";

    document.body.appendChild(title);
    document.body.appendChild(this.video);
    const div2 = document.createElement('div');
    document.body.appendChild(div2);
    div2.style.marginBottom = '10px';
    const addClass = document.createElement('button')
    addClass.className='btn btn-success';
    addClass.innerText = "Add Pet";
    div2.appendChild(addClass);
    addClass.addEventListener('click', ()=> this.addPet())

    const exportBtn = document.createElement('button')
    exportBtn.className='btn btn-warning';
    exportBtn.innerText = "Export";
    div2.appendChild(exportBtn);
    exportBtn.addEventListener('click', ()=> this.save());

    while(PETS.length<2){
      this.addPet();

    }
    // Create training buttons and info texts
    for (let i = 0; i < PETS.length; i++) {
      //for (const pet of PETS){
      const div = document.createElement('div');
      document.body.appendChild(div);
      div.style.marginBottom = '10px';

      // Create training button
      const class_button = document.createElement('button');
      class_button.className='btn btn-primary';

      class_button.innerText = "Train " + PETS[i];
      div.appendChild(class_button);

      // Listen for mouse events when clicking the button
      class_button.addEventListener('mousedown', () => this.training = i);
      class_button.addEventListener('mouseup', () => this.training = -1);
      class_button.addEventListener('touchstart', () => this.training = i);
      class_button.addEventListener('touchend', () => this.training = -1);

      // Create info text
      const infoText = document.createElement('span')
      infoText.innerText = " No examples added";
      div.appendChild(infoText);
      this.infoTexts.push(infoText);

    // Setup webcam
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((stream) => {
        this.video.srcObject = stream;
        this.video.width = IMAGE_SIZE*1.5;
        this.video.height = IMAGE_SIZE*1.5;

        this.video.addEventListener('playing', () => this.videoPlaying = true);
        this.video.addEventListener('paused', () => this.videoPlaying = false);
      })
  }
}

updateClasses(){
  this.bindPage();

  // Create training buttons and info texts
    const div = document.createElement('div');
    document.body.appendChild(div);
    div.style.marginBottom = '10px';

    // Create training button
    const class_button = document.createElement('button');
    class_button.className='btn btn-primary';

    class_button.innerText = "Train " + PETS[PETS.length-1];

    div.appendChild(class_button);

    // Listen for mouse events when clicking the button
    class_button.addEventListener('mousedown', () => this.training = PETS.length-1);
    class_button.addEventListener('mouseup', () => this.training = -1);
    class_button.addEventListener('touchstart', () => this.training = PETS.length-1);
    class_button.addEventListener('touchend', () => this.training = -1);

    // Create info text
    const infoText = document.createElement('span')
    infoText.innerText = " No examples added";
    div.appendChild(infoText);
    this.infoTexts.push(infoText);


}

  addPet() {
    var pet = prompt("Please enter your pet's name", "PET Name");
    if (pet != null) {
      PETS.push(pet);
    }
    this.updateClasses()
  }
  save() {
     let dataset = this.knn.getClassifierDataset()
     var datasetObj = {}
     Object.keys(dataset).forEach((key) => {
       let data = dataset[key].dataSync();
       // use Array.from() so when JSON.stringify() it covert to an array string e.g [0.1,-0.2...]
       // instead of object e.g {0:"0.1", 1:"-0.2"...}
       datasetObj[key] = Array.from(data);
     });
     let jsonStr = JSON.stringify(datasetObj)
     console.log(jsonStr);

     //can be change to other source
     fs.writeFileSync('myData.json', jsonStr);

     // fs.writeFileSync('myData', jsonStr, (err) => {
     //  if (err) throw err;
     //  console.log('The file has been saved!');
     //  });
     //  localStorage.setItem("myData", jsonStr);

      // fs.writeFileSync('./myData.json', jsonStr, err => {
      //     if (err) {
      //         console.log('Error writing file', err)
      //     } else {
      //         console.log('Successfully wrote file')
      //     }
      // })
   }
   load() {
       //can be change to other source
      let dataset = localStorage.getItem("myData")
      let tensorObj = JSON.parse(dataset)
      //covert back to tensor
      Object.keys(tensorObj).forEach((key) => {
        tensorObj[key] = tf.tensor(tensorObj[key], [tensorObj[key].length / 1000, 1000])
      })
      this.knn.setClassifierDataset(tensorObj);
    }


  async bindPage() {
    this.knn = knnClassifier.create();
    this.mobilenet = await mobilenetModule.load();

    this.start();
  }

  start() {
    if (this.timer) {
      this.stop();
    }
    this.video.play();
    this.timer = requestAnimationFrame(this.animate.bind(this));
  }

  stop() {
    this.video.pause();
    cancelAnimationFrame(this.timer);
  }


  async animate() {
    if (this.videoPlaying) {
      // Get image data from video element
      const image = tf.fromPixels(this.video);

      let logits;
      // 'conv_preds' is the logits activation of MobileNet.
      const infer = () => this.mobilenet.infer(image, 'conv_preds');

      // Train class if one of the buttons is held down
      if (this.training != -1) {
        logits = infer();
        // Add current image to classifier
        this.knn.addExample(logits, this.training)
      }


      var numClasses = this.knn.getNumClasses();
      if (numClasses > 0) {
        // If classes have been added run predict
        logits = infer();
        const res = await this.knn.predictClass(logits, TOPK);

        for (let i = 0; i < PETS.length; i++) {

          // The number of examples for each class
          const exampleCount = this.knn.getClassExampleCount();

          // Make the predicted class bold
          if (res.classIndex == i) {
            this.infoTexts[i].style.fontWeight = 'bold';
          } else {
            this.infoTexts[i].style.fontWeight = 'normal';
          }

          // Update info text
          if (exampleCount[i] > 0) {
            this.infoTexts[i].innerText = ` ${exampleCount[i]} examples ${PETS[i]} probability - ${res.confidences[i] * 100}%`
          }
        }
      }

      // Dispose image when done
      image.dispose();
      if (logits != null) {
        logits.dispose();
      }
    }
    this.timer = requestAnimationFrame(this.animate.bind(this));
  }
}

window.addEventListener('load', () => new Main());
