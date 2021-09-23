+++
title = "Real-time face and hand detection using JavaCV"
tags = [
    "java",
    "ai",
    "tech"
]
date = "2014-03-13"
+++

# Introduction

[JavaCV](https://code.google.com/p/javacv/) is a Java wrapper to a number of  computer vision libraries including [OpenCV](http://opencv.org/), [OpenKinect](http://openkinect.org/wiki/Main_Page) and others. In this article we'll look at using JavaCV with OpenCV to do real-time face and hand detection on a video stream. Face detection (as opposed to face recognition) has become mainstream with everything from Facebook to low-budget digital cameras supporting it.

Hand detection and gesture recognition is somewhat less mature and I was hard pressed to find good open source implementations of this. Gesture recognition, I suspect, will become increasingly more important in human computer interaction as the trend to "keep technology hidden" accelerates.

# Installing JavaCV

To install JavaCV we first need OpenCV which is supplied as C and C++ source code. Fortunately OpenCV contains pre-built dll's and a jar for Windows. For other platforms the OpenCV libraries need to be compiled but that is beyond the scope of this article. OpenCV can be downloaded from here: http://opencv.org/. OpenCV also requires the Visual Studio 2012 C++ redistributables.

Once the prerequisites are in place we can download JavaCV jar here: https://code.google.com/p/javacv/

To get the samples below running, you need the following jars in your classpath and dlls in your java.library path:

- From JavaCV: javacv.jar, javacpp.jar and javacv-windows-x86.jar OpenCV-244.jar  
- OpenCV-244.jar from OpenCV (or whathever version you're using if not 2.44)
- The following OpenCV dlls:  avcodec-52.dll avdevice-52.dll  avfilter-1.dll  avformat-52.dll  avutil-50.dll  
opencv_calib3d244.dll  opencv_core244.dll  opencv_features2d244.dll
opencv_flann244.dll opencv_highgui244.dll opencv_imgproc244.dll opencv_java244.dll
opencv_objdetect244.dll postproc-51.dll swscale-0.dll
- And the following dlls from the VC++ 2012 Redistributable libraries:  
mfc110.dll mfc110u.dll mfcm110.dll mfcm110u.dll msvcp110.dll
msvcr110.dll vccorlib110.dll

# Video echo

Let's start off with a simple demo to prove that JavaCV and OpenCV are correctly installed and create a base that we can use to build on for face and hand recognition. The code below grabs an image from the first available webcam and displays into a JavaCV frame (which extends a Swing Frame).

```java
import static com.googlecode.javacv.cpp.opencv_core.*;

import com.googlecode.javacv.CanvasFrame;
import com.googlecode.javacv.cpp.opencv_highgui;
import com.googlecode.javacv.cpp.opencv_highgui.CvCapture;

public class EchoDemo {
  public static void main(String[] args) throws Exception {
    // Grab the default video defive. This work for both built-win
    // and usb webcams.
    CvCapture capture = opencv_highgui.cvCreateCameraCapture(0);

    // Set the capture resolution 480x320 gives decent quality
    // and the lower resolution will make our real-time video
    // processing a little faster.
    opencv_highgui.cvSetCaptureProperty(capture,
        opencv_highgui.CV_CAP_PROP_FRAME_HEIGHT, 320);
    opencv_highgui.cvSetCaptureProperty(capture,
        opencv_highgui.CV_CAP_PROP_FRAME_WIDTH, 480);

    // Construct a JavaCV Image that matches the properties of the
    // captured imaged.
    IplImage grabbedImage = opencv_highgui.cvQueryFrame(capture);

    // Create a frame to echo to.
    CanvasFrame frame = new CanvasFrame("Echo Demo", 1);

    // Keep looping while our frame is visable and we're getting
    // images from the web cam
    while (frame.isVisible()
        && (grabbedImage = opencv_highgui.cvQueryFrame(capture))
          != null) {
      // display cpatured image on frame
      frame.showImage(grabbedImage);
    }

    // clean up after ourselves.
    frame.dispose();
    opencv_highgui.cvReleaseCapture(capture);
  }
}
```

# Object detection with Haar classifiers

OpenCV supports a number of techniques for object detection. “Haar feature-based cascade classifiers” is one such technique that is especially suited for real-time object detection due to its constant-time performance characteristics. These classifiers are stored in xml format and have to loaded to construct a CvHaarClassifierCascade object which in turn is used by the cvHaarDetectObjects function to search an image and return a sequence of matches.

To construct the classifier from a file, we use this code snippet:
```
CvHaarClassifierCascade classifier = new CvHaarClassifierCascade(
        cvLoad(“classifer.xml”));
```

Then, to apply the classifier to an image we use the cvHaarDetectObjects function:
```
CvSeq objects = cvHaarDetectObjects(inImage, classifier,
        storage, 1.1, 3, CV_HAAR_DO_CANNY_PRUNING);
```

The signature of the underlying c function is as follows:
```
public static IntPtr cvHaarDetectObjects(
 IntPtr image,
 IntPtr cascade,
 IntPtr storage,
 double scaleFactor,
 int minNeighbors,
 int flags,
 MCvSize minSize
)
```

# Face and Hand Detection

In this article we want to focus on face and hand detection. We could train our own Haar classifiers, but I'm saving that for a possible future blog. Instead we're just going to make use of pre-existing classifiers.

Fortunately, OpenCV comes with some classifiers and for face detection we can use "../opencv/data/haarcascades/haarcascade_frontalface_alt.xml".

Unfortunately, OpenCV does not come with classifier for hand detection and I had to resort to Google. After testing a few I settled on this one ad the best performing hand classifier that I could find: http://github.com/dlion/ExamProject/blob/master/Head/hand.xml

Next we apply all of this to modify our basic Video Echo code:
```java
import static com.googlecode.javacv.cpp.opencv_core.*;
import static com.googlecode.javacv.cpp.opencv_imgproc.*;
import static com.googlecode.javacv.cpp.opencv_objdetect.*;

import com.googlecode.javacpp.Loader;
import com.googlecode.javacv.CanvasFrame;
import com.googlecode.javacv.cpp.opencv_core.CvScalar;
import com.googlecode.javacv.cpp.opencv_highgui;
import com.googlecode.javacv.cpp.opencv_highgui.CvCapture;
import com.googlecode.javacv.cpp.opencv_objdetect;
import com.googlecode.javacv.cpp.opencv_objdetect.CvHaarClassifierCascade;


public class ObjectDetectionDemo {
  public static void main(String[] args) throws Exception {

    // Load object detection
    Loader.load(opencv_objdetect.class);

    // Construct classifiers from xml.
    CvHaarClassifierCascade faceClassifier = loadHaarClassifier(
        "C:/Java/opencv/data/haarcascades/haarcascade_frontalface_alt.xml");
    CvHaarClassifierCascade handClassifier = loadHaarClassifier(
        "C:/Java/opencv/data/haarcascades/haarcascade_hand.xml");

    // Grab the default video device. This work for both built-win
    // and usb webcams.
    CvCapture capture = opencv_highgui.cvCreateCameraCapture(0);

    // Set the capture resolution 480x320 gives decent quality
    // and the lower resolution will make our real-time video
    // processing a little faster.
    opencv_highgui.cvSetCaptureProperty(capture,
        opencv_highgui.CV_CAP_PROP_FRAME_HEIGHT, 320);
    opencv_highgui.cvSetCaptureProperty(capture,
        opencv_highgui.CV_CAP_PROP_FRAME_WIDTH, 480);

    // Contruct a JavaCV Image that matches the properties of the
    // captured imaged.
    IplImage grabbedImage = opencv_highgui.cvQueryFrame(capture);
    IplImage mirrorImage = grabbedImage.clone();
    IplImage grayImage = IplImage.create(mirrorImage.width(),
        mirrorImage.height(), IPL_DEPTH_8U, 1);

    // OpenCV's C++ roots means we need to allocate memory
    // to use as working storage for object detection.
    CvMemStorage faceStorage = CvMemStorage.create();
    CvMemStorage handStorage = CvMemStorage.create();

    //Create a frame to echo to.
    CanvasFrame frame = new CanvasFrame("Object Detection Demo", 1);

    // Keep looping while our frame is visible and we're getting
    // images from the webcam
    while (frame.isVisible()
        && (grabbedImage = opencv_highgui.cvQueryFrame(capture))
          != null) {

      // Clear out storage
      cvClearMemStorage(faceStorage);
      cvClearMemStorage(handStorage);

      // Flip the image because a mirror image looks more natural
      cvFlip(grabbedImage, mirrorImage, 1);
      // Create a black and white image - best for face detection
      // according to OpenCV sample.
      cvCvtColor(mirrorImage, grayImage, CV_BGR2GRAY);

      // Find faces in grayImage and mark with green
      // rectangles on mirrorImage.
      findAndMarkObjects(faceClassifier, faceStorage,
          CvScalar.GREEN, grayImage, mirrorImage);

      // Find hands in mirrorImage and mark with green
      // rectangles on mirrorImage
      findAndMarkObjects(handClassifier, handStorage,
          CvScalar.BLUE, mirrorImage,mirrorImage);

      // display mirrorImage on frame
      frame.showImage(mirrorImage);
    }

   // display captured image on frame
    frame.dispose();
    opencv_highgui.cvReleaseCapture(capture);
  }

  /**
   * Find objects matching the supplied Haar classifier.
   *
   * @param classifier The Haar classifier for the object we're looking for.
   * @param storage In-memory storage to use for computations
   * @param colour Colour of the marker used to make objects found.
   * @param inImage Input image that we're searching.
   * @param outImage Output image that we're going to mark and display.
   */
  private static void findAndMarkObjects(
      CvHaarClassifierCascade classifier,
      CvMemStorage storage,
      CvScalar colour,
      IplImage inImage,
      IplImage outImage) {

    CvSeq faces = cvHaarDetectObjects(inImage, classifier,
        storage, 1.1, 3, CV_HAAR_DO_CANNY_PRUNING);
    int totalFaces = faces.total();
    for (int i = 0; i < totalFaces; i++) {
      CvRect r = new CvRect(cvGetSeqElem(faces, i));
      int x = r.x(), y = r.y(), w = r.width(), h = r.height();
      cvRectangle(outImage, cvPoint(x, y), cvPoint(x + w, y + h),
          colour, 1, CV_AA, 0);
    }h
  }

  /**
   * Load a Haar classifier from its xml representation.
   *
   * @param classifierName Filename for the haar classifier xml.
   * @return a Haar classifier object.
   */
  private static CvHaarClassifierCascade loadHaarClassifier(
      String classifierName) {

    CvHaarClassifierCascade classifier = new CvHaarClassifierCascade(
        cvLoad(classifierName));
    if (classifier.isNull()) {
      System.err.println("Error loading classifier file \"" + classifier
          + "\".");
      System.exit(1);
    }

    return classifier;
  }
}
```

Running the above samples, you'll find that face detection is really reliable as long as it has a frontal view of a face that isn't turned too much. The hand detection finds a lot of false negatives and often skips a few frames in identifying open and closed hands. In a future blog I hope to show how Haar classifiers can be trained and hope to improve on the hand recognition performance.

# Other computer vision applications

Along with voice interaction, (hand) gesture recognition, in my opinion, is set to make a strong entrance into the field of human computer interfaces especially with "non obtrusive" consumer electronics trends accelerating. The [Google Glass](http://www.google.com/glass/start/what-it-does/) platform already makes use primarily of voice interfaces and its a natural match for gesture recognition and other computer vision techniques.

[Kinect](http://www.xbox.com/en-us/Kinect) makes use of skeleton tracking for gaming and has an SDK with good support for voice and face recognition, directional sound with its set of stereo microphones and depth calculations with its 3 separate cameras build in.

[This video](http://www.youtube.com/watch?v=c4LobbqeKZc) demonstrates how Haar cascades can be used to detect and count cars.

Perhaps the most promising work I've seen on hand gesture recognition is [this article](http://www.javaadvent.com/2012/12/hand-and-finger-detection-using-javacv.html) by Dr. Andrew Davison. He goes beyond simple hand detection, and maps out not just the hand, but it's structure and labels each finger tip. This is exactly the approach that needs to be perfected for a full production ready implementation of gesture recognition. Unfortunately, Dr. Davison's approach suffers from the drawback that it relies too much on colour  and he demonstrates his approach wearing a black glove against a mostly light background.

# Conclusion

While face recognition performs very well, gesture recognition is not ready for prime-time insofar as I've been able to find good open source implementations. I hope to show how Haar classifier can be generated through "training" in a future blog and see if it's possible to improve the hand detection's accuracy.
