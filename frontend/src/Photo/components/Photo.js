import React, { useState, useEffect, useCallback, Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Button, Switch } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { resetSearch, searchPhoto } from "../actions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleNotch,
  faSync,
  faVideoSlash,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import { faCircle } from "@fortawesome/free-regular-svg-icons";

import "./Photo.scss";

const useStyles = makeStyles((theme) => ({
  button: {
    margin: theme.spacing(1),
  },
  input: {
    display: "none",
  },
}));

function Photo({
  reset,
  searchPhoto,
  predictionPending,
  predictionResponse,
  prediction,
  predictionError,
  minScore,
  labelSettings,
  status,
}) {
  const [image, setImage] = useState(null);
  const [cameraEnabled, setCameraEnabled] = useState(null);
  const [video, setVideo] = useState(null);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const [imageCanvas, setImageCanvas] = useState(null);
  const [zonesCanvas, setZonesCanvas] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");

  const classes = useStyles();

  useEffect(() => {
    enableCamera();
  }, []);

  useEffect(() => {
    drawDetections(); 
  }, [prediction]);

  const videoRef = useCallback(
    (node) => {
      setVideo(node);
      if (node) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode } })
          .then((stream) => (node.srcObject = stream));
      }
    },
    [facingMode]
  );

  const imageCanvasRef = useCallback((node) => {
    setImageCanvas(node);
  }, []);

  const zonesCanvasRef = useCallback((node) => {
    setZonesCanvas(node);
  }, []);

  function enableCamera() {
    setCameraEnabled(!cameraEnabled);
    setImage(null);
  }

  function onCameraToggled() {
    reset();
    enableCamera();
  }

  function onCameraClicked() {
    updateImageCanvas();

    let imageData = imageCanvas.toDataURL("image/jpeg");
    const base64data = imageData.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
    searchPhoto(base64data);

    //updateZonesCanvas();
  }

  function updateImageCanvas() {
    setVideoWidth(video.videoWidth);
    setVideoHeight(video.videoHeight);

    if (!imageCanvas) {
      return;
    }

    imageCanvas.width = video.videoWidth;
    imageCanvas.height = video.videoHeight;

    imageCanvas.getContext("2d").drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    video.srcObject.getVideoTracks().forEach((track) => {
      track.stop();
    });

    setImage(imageCanvas.toDataURL());
    setCameraEnabled(false);
  }

  function updateZonesCanvas() {
    zonesCanvas.width = imageCanvas.width;
    zonesCanvas.height = imageCanvas.height;

    const ctx = zonesCanvas.getContext("2d");

    ctx.fillStyle = "#565656";
    ctx.globalAlpha = 0.7;
    ctx.fillRect(0, 0, zonesCanvas.width, zonesCanvas.height);
  }

  function drawDetections() {
    if (!prediction || !prediction.detections || !imageCanvas.getContext) {
      return;
    }
    // prediction.detections.filter((d) => d.score > minScore).forEach((d) => drawDetection(d));
    const bboxes = prediction.detections.filter((d) => d.score > minScore).map((d) => drawDetectionControl(d));
    bboxes.forEach((b)=> drawBbox(b));
  }

  function drawBbox({x, y, width, height, color, label, score}) {
    const ctx = imageCanvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeStyle = "#76b900";
    ctx.strokeRect(x, y, width, height);
    var score = score.toFixed(3);

    var discount = discountSwitch(label);

    let message = label + ", " + score + ", " + discount
    const couponText = String(message);
    const baseX = x + 0 * width;
    const baseY = y + 0 * height;
    // Draw coupon
    ctx.save();
    ctx.translate(baseX, baseY)
    ctx.font = couponText;
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#76b900';
    var width = ctx.measureText(couponText).width;
    ctx.fillRect(0, 0, width, 12);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(couponText, 0, 0);
    ctx.restore();
  };

  function discountSwitch(label) {
    switch(label) {
      case "Human face":
        return "0% Discount"
      case "Mobile phone":
        return "10% Discount"
      case "Glasses":
        return "8% Discount"
      default:
        return "5% Discount"
      }
  };

  function drawDetectionControl({ box, label, score, cValue }) {
    const drawScore = true;
    const textBgHeight = 14;
    const padding = 2;
    const letterWidth = 7.25;
    const scoreWidth = drawScore ? 4 * letterWidth : 0;
    const text = drawScore ? `${label} ${Math.floor(score * 100)}%` : label;

    const width = Math.floor((box.xMax - box.xMin) * imageCanvas.width);
    const height = Math.floor((box.yMax - box.yMin) * imageCanvas.height);
    const x = Math.floor(box.xMin * imageCanvas.width);
    const y = Math.floor(box.yMin * imageCanvas.height);
    const labelSetting = labelSettings[label];
    const labelWidth = label.length * letterWidth + scoreWidth + padding * 2;
    let bbox = { 
      "x": x, 
      "y": y,
      "width": width,
      "height": height,
      "bgColor": labelSetting.bgColor,
      "label": label,
      "score": score
     };
    
    return bbox
  } 

  

  function drawDetection({ box, label, score, cValue }) {
    const drawScore = true;
    const textBgHeight = 14;
    const padding = 2;
    const letterWidth = 7.25;
    const scoreWidth = drawScore ? 4 * letterWidth : 0;
    const text = drawScore ? `${label} ${Math.floor(score * 100)}%` : label;

    const width = Math.floor((box.xMax - box.xMin) * imageCanvas.width);
    const height = Math.floor((box.yMax - box.yMin) * imageCanvas.height);
    const x = Math.floor(box.xMin * imageCanvas.width);
    const y = Math.floor(box.yMin * imageCanvas.height);
    const labelSetting = labelSettings[label];
    const labelWidth = label.length * letterWidth + scoreWidth + padding * 2;

    
    drawBox(x, y, width, height, labelSetting.bgColor);
    //drawBoxTextBG(x, y + height - textBgHeight, labelWidth, textBgHeight, labelSetting.bgColor);
    //drawBoxText(text, x + padding, y + height - padding);
    // drawCoupon(cValue, x, y, width, height);
    drawCoupon(label, score, x, y, width, height);
    // clearZone(x + 5, y + height - textBgHeight - 4, labelWidth, textBgHeight);
    // clearZone(x, y, width, height);
  }

  function drawBox(x, y, width, height, color) {
    const ctx = imageCanvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeStyle = color;
    ctx.strokeRect(x, y, width, height);
  }

  function drawBoxTextBG(x, y, width, height, color) {
    const ctx = imageCanvas.getContext("2d");

    // ctx.strokeStyle = getLabelSettings(label).color;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }

  function drawBoxText(text, x, y) {
    const ctx = imageCanvas.getContext("2d");
    ctx.font = "12px Mono";
    ctx.fillStyle = "white";
    ctx.fillText(text, x, y);
  }

  function drawCoupon(label, score, x, y, width, height) {
    const ctx = imageCanvas.getContext("2d");
    let message = label + ", " +score
    console.log("message", message)
    const couponText = String(message);
    const angle = 0.25;

    if ( (x + 0.5 * width + 135) < imageCanvas.width) {  // Draw on the right side
      const baseX = x + 0.5 * width;
      const baseY = y + 0.3 * height;
      // Draw coupon
      ctx.translate(baseX, baseY)
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(25, -25);
      ctx.lineTo(135, -25);
      ctx.lineTo(135, 40);
      ctx.lineTo(25, 40);
      ctx.lineTo(0, 15);
      ctx.closePath();
      // Hole
      ctx.arc(15, 7, 7, 0, Math.PI * 2, false) 
      ctx.fillStyle = "red";
      ctx.mozFillRule = 'evenodd'; //for old firefox 1~30
      ctx.fill('evenodd'); //for firefox 31+, IE 11+, chrome
      // Text
      ctx.font = "20px Verdana";
      ctx.fillStyle = "white";
      ctx.fillText(couponText, 35, 14);
    } else { // Draw on the left side
      const baseX = x + 0.25 * width;
      const baseY = y + 0.3 * height;
      // Draw coupon
      ctx.translate(baseX, baseY)
      ctx.rotate(-angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-25, -25);
      ctx.lineTo(-135, -25);
      ctx.lineTo(-135, 40);
      ctx.lineTo(-25, 40);
      ctx.lineTo(0, 15);
      ctx.closePath();
      // Hole
      ctx.arc(-15, 7, 7, 0, Math.PI * 2, false) 
      ctx.fillStyle = "red";
      ctx.mozFillRule = 'evenodd'; //for old firefox 1~30
      ctx.fill('evenodd'); //for firefox 31+, IE 11+, chrome
      // Text
      ctx.font = "20px Verdana";
      ctx.fillStyle = "white";
      ctx.fillText(couponText, -125, 14);
    }
  }

  function clearZone(x, y, width, height) {
    const ctx = zonesCanvas.getContext("2d");
    ctx.clearRect(x - 3, y - 6, width + 6, height + 6);
  }

  function onFacingModeClicked() {
    if (facingMode === "user") {
      setFacingMode("environment");
    } else {
      setFacingMode("user");
    }
  }

  function renderCamera() {
    const displayVideoToggle = status.kafka === "connected" ? {} : { display: "none" };

    if (!cameraEnabled || image) {
      return null;
    }

    return (
      <div className="camera">
        <div className="img-preview">
          <div className="img-container">
            <video
              className="camera-preview"
              ref={videoRef}
              controls={false}
              autoPlay
              playsInline
            />
            <div className="horizontal overlay">
              {/*<HorizontalCameraBorder className={"horizontal-camera-border-svg"} />*/}
            </div>
            <div className="vertical overlay">
              {/*<VerticalCameraBorder className={"vertical-camera-border-svg"} />*/}
            </div>
          </div>
        </div>
        <div className="left-button-container button-container">
          <Button
            variant="contained"
            size="large"
            className="choose-camera-button"
            onClick={onFacingModeClicked}
          >
            <FontAwesomeIcon icon={faSync} />
          </Button>
        </div>
        <div className="center-button-container button-container">
          <Button
            variant="contained"
            size="large"
            className="take-picture-button"
            onClick={onCameraClicked}
          >
            <FontAwesomeIcon icon={faCircle} />
          </Button>
        </div>
        <div className="right-button-container button-container">
          <Link to={"/video"} style={displayVideoToggle}>
            <Button
              variant="contained"
              size="large"
              className="choose-camera-button"
              onClick={onFacingModeClicked}
            >
              <FontAwesomeIcon icon={faVideoSlash} />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  function renderSnapshot() {
    const displayResult = image ? {} : { display: "none" };
    const displayButtons = predictionPending ? { display: "none" } : {};
    const displayLoading = predictionPending ? {} : { display: "none" };

    const displayError =
      !predictionPending && predictionError
        ? { width: `${videoWidth}px`, height: `${videoHeight}px` }
        : { display: "none" };

    const displayImage =
      !predictionPending && !predictionError && prediction ? {} : { display: "none" };

    
    let displayNoObjects;
    /*
    if (
      !predictionPending &&
      prediction &&
      (!prediction.detections || prediction.detections.length === 0)
    ) {
      displayNoObjects = {};
    } else {
      displayNoObjects = { display: "none" };
    }
    */
    displayNoObjects = { display: "none" }; // Never show no objects

    return (
      <div className="result" style={displayResult}>
        <div className="img-preview">
          <div className="error-container" style={displayError}>
            <h2>
              <FontAwesomeIcon className="error-icon" icon={faExclamationCircle} /> Error
            </h2>
            <code>{JSON.stringify(predictionError, null, 2)}</code>
          </div>
          <div className="img-container" style={displayImage}>
            <canvas className="result-canvas" ref={imageCanvasRef} />
            <div className="zones overlay">
              <canvas className="zones-canvas" ref={zonesCanvasRef} />
            </div>
            <div className="loading overlay" style={displayLoading}>
              <div>
                <FontAwesomeIcon className="loading-icon" icon={faCircleNotch} spin />
              </div>
              <div className="loading-text">Loading ...</div>
            </div>
            <div className="no-objects overlay" style={displayNoObjects}>
              <div className="no-objects-text">No Objects</div>
              <div className="no-objects-text">Found</div>
            </div>
          </div>
        </div>
        <div className="left-button-container button-container" style={displayButtons}></div>
        <div className="center-button-container button-container" style={displayButtons}>
          <Button
            variant="contained"
            size="large"
            className="re-take-picture-button"
            onClick={onCameraToggled}
          >
            <span className="label-word">Try</span>
            <span className="label-word">again</span>
          </Button>
        </div>
        <div className="right-button-container button-container" style={displayButtons}></div>
      </div>
    );
  }

  return (
    <div className="photo">
      {renderCamera()}
      {renderSnapshot()}
    </div>
  );
}

function mapStateToProps(state) {
  return { ...state.appReducer, ...state.photoReducer };
}

function mapDispatchToProps(dispatch) {
  return {
    reset: () => {
      dispatch(resetSearch());
    },
    searchPhoto: (photo) => {
      dispatch(searchPhoto(photo));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Photo);
