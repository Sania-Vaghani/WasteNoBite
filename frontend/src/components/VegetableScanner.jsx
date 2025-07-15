import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Card, CardContent } from "./ui/Card";
import { Upload, Camera, RotateCcw, Loader2, X } from "lucide-react";

export default function VegetableScanner(props) {
  const [currentStep, setCurrentStep] = useState("upload"); // upload, processing, results
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [detectionResults, setDetectionResults] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Mock detection results - in real app, this would come from AI API
  const mockDetectionResults = {
    detectedVegetables: [
      {
        name: "Spinach",
        count: 1,
        confidence: 0.73,
        color: "bg-green-500",
      },
    ],
    totalTypes: 1,
    totalCount: 1,
    mostCommon: "Spinach",
    boundingBoxes: [
      {
        x: 20,
        y: 15,
        width: 60,
        height: 70,
        label: "spinach 0.73",
      },
    ],
  };

  const handleFileSelect = (file) => {
    if (file && (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/jpg")) {
      setUploadedFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDetectVegetables = () => {
    if (!uploadedFile) return;

    setCurrentStep("processing");

    // Simulate AI processing
    setTimeout(() => {
      setDetectionResults(mockDetectionResults);
      setCurrentStep("results");
    }, 2500);
  };

  const handleReset = () => {
    setCurrentStep("upload");
    setUploadedFile(null);
    setUploadedImage(null);
    setDetectionResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    props.onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={props.isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <DialogHeader className="pb-4">
          <div className="flex items-center">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
              <Camera className="h-6 w-6 mr-2 text-green-600" />
              Scan Item
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-6 mb-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Vegetable Detection</h2>
          <p className="text-green-100">Upload an image to identify and count vegetables</p>
        </div>

        {/* Upload Step */}
        {currentStep === "upload" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-green-700 mb-4">Upload Image</h3>

              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
                  isDragOver
                    ? "border-green-400 bg-green-50"
                    : uploadedImage
                    ? "border-green-300 bg-green-25"
                    : "border-green-300 bg-green-25"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {uploadedImage ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={uploadedImage || "/placeholder.svg"}
                        alt="Uploaded"
                        className="max-w-full max-h-64 rounded-lg shadow-lg"
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      {uploadedFile?.name} ({formatFileSize(uploadedFile?.size || 0)})
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 bg-green-100 rounded-full">
                        <Upload className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-lg text-gray-700 mb-2">Drag and drop an image here or click to browse</p>
                      <p className="text-sm text-gray-500">Supported formats: JPG, PNG, JPEG</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button
                onClick={handleDetectVegetables}
                disabled={!uploadedFile}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                Detect Vegetables
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2 bg-transparent"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {currentStep === "processing" && (
          <div className="text-center py-12">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="p-6 bg-green-100 rounded-full">
                  <Loader2 className="h-12 w-12 text-green-600 animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Image...</h3>
                <p className="text-gray-600">AI is analyzing your image to detect vegetables</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full animate-pulse"
                  style={{ width: "75%" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Results Step */}
        {currentStep === "results" && detectionResults && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-green-700 mb-6">Detection Results</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Detected Image */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Detected Image</h4>
                  <Card className="bg-white border-green-200">
                    <CardContent className="p-4">
                      <div className="relative">
                        <img
                          src={uploadedImage || "/placeholder.svg"}
                          alt="Detection Result"
                          className="w-full rounded-lg"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {/* You can add more result details here as needed */}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
