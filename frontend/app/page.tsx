"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Upload, Check, Loader2, ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { optimizeImage, formatFileSize, calculateSizeReduction } from "@/utils/image-optimizer"

interface FoodItem {
  ingredient: string
  amount: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface ImageInfo {
  url: string
  originalSize: number
  optimizedSize: number
  dimensions: {
    width: number
    height: number
  }
  fileName: string
}

export default function CalorieCounter() {
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState<FoodItem[]>([])
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      // Handle non-image files
      alert("Please upload an image file (JPEG, PNG, etc.)")
      return
    }

    try {
      setIsOptimizing(true)
      setOptimizationProgress(10)

      // Simulate progress steps
      const progressInterval = setInterval(() => {
        setOptimizationProgress((prev) => {
          const newProgress = prev + 15
          return newProgress < 90 ? newProgress : prev
        })
      }, 200)

      // Get original file size
      const originalSize = file.size
      const fileName = file.name

      // Optimize the image
      const { blob, dimensions } = await optimizeImage(file)

      // Create a URL for the optimized image
      const optimizedUrl = URL.createObjectURL(blob)

      // Clear the progress interval
      clearInterval(progressInterval)
      setOptimizationProgress(100)

      // Set the selected image with optimization info
      setSelectedImage({
        url: optimizedUrl,
        originalSize,
        optimizedSize: blob.size,
        dimensions,
        fileName,
      })

      // Reset analysis state
      setHasAnalyzed(false)

      // Small delay to show 100% progress before hiding
      setTimeout(() => {
        setIsOptimizing(false)
        setOptimizationProgress(0)
      }, 500)
    } catch (error) {
      console.error("Error optimizing image:", error)
      setIsOptimizing(false)
      setOptimizationProgress(0)
      // Here you could add error handling UI
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isDragging) {
        setIsDragging(true)
      }
    },
    [isDragging],
  )

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }, [])

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleAnalyze = async () => {
    setIsAnalyzing(true);

    if (!selectedImage) {
      setIsAnalyzing(false);
      alert("Please upload an image first.");
      return;
    }

    try {
      const formData = new FormData();
      const imageBlob = await fetch(selectedImage.url).then(r => r.blob());
      formData.append("image_file", imageBlob, selectedImage.fileName);

      const response = await fetch("http://localhost:8000/estimate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const mealAnalysis = data.result.ingredients;

      setResults(mealAnalysis);
      setHasAnalyzed(true);
    } catch (error) {
      console.error("Error analyzing image:", error);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAll = () => {
    // Revoke object URL to prevent memory leaks
    if (selectedImage?.url) {
      URL.revokeObjectURL(selectedImage.url)
    }

    setSelectedImage(null)
    setResults([])
    setHasAnalyzed(false)
  }

  return (
    <div className="container mx-auto py-10">
      {/* <h1 className="text-3xl font-bold text-center mb-10">Calorie Counter</h1> */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Panel - Upload Area */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Upload Food Image</CardTitle>
            <CardDescription>Upload an image of your meal to analyze its nutritional content</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isOptimizing && (
              <div className="border-t border-border p-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Optimizing image...</span>
                  </div>
                  <Progress value={optimizationProgress} className="h-2" />
                </div>
              </div>
            )}

            {!isOptimizing && !selectedImage ? (
              <div className="border-t border-border p-6">
                <div
                  className={`
                    border-2 border-dashed rounded-lg p-12 w-full 
                    flex flex-col items-center justify-center transition-colors duration-200
                    ${
                      isDragging
                        ? "border-primary bg-primary/5 border-primary"
                        : "border-gray-300 hover:border-gray-400"
                    }
                  `}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  aria-label="Drag and drop area. Click or drag files here to upload."
                  onClick={handleBrowseClick}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleBrowseClick()
                    }
                  }}
                >
                  {isDragging ? (
                    <>
                      <ImageIcon className="h-10 w-10 text-primary mb-4" />
                      <p className="text-sm text-primary font-medium mb-4">Drop your image here</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-gray-400 mb-4" />
                      <p className="text-sm text-gray-500 mb-4">Drag and drop or click to upload</p>
                      <Button>Browse Files</Button>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                    aria-hidden="true"
                  />
                </div>
              </div>
            ) : !isOptimizing && selectedImage ? (
              <div className="relative w-full h-[calc(100vh-20rem)] min-h-[400px]">
                {/* Image display */}
                <img
                  src={selectedImage.url || "/placeholder.svg"}
                  alt="Food image"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Image info overlay */}
                <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 to-transparent text-white">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                      {selectedImage.dimensions.width} × {selectedImage.dimensions.height}
                    </Badge>
                    <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                      {formatFileSize(selectedImage.optimizedSize)}
                    </Badge>
                    <Badge variant="outline" className="bg-green-500/80 text-white border-green-400/30">
                      <Check className="h-3 w-3 mr-1" />
                      Saved {calculateSizeReduction(selectedImage.originalSize, selectedImage.optimizedSize)}
                    </Badge>
                  </div>
                </div>

                {/* Buttons overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="flex justify-between">
                    <Button variant="secondary" onClick={resetAll} className="shadow-lg">
                      Remove
                    </Button>
                    <Button onClick={handleAnalyze} disabled={isAnalyzing} className="shadow-lg">
                      {isAnalyzing ? "Analyzing..." : "Analyze"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Right Panel - Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Nutritional Analysis</CardTitle>
            <CardDescription>Detailed breakdown of your meal's nutritional content</CardDescription>
          </CardHeader>
          <CardContent>
            {hasAnalyzed ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Calories</TableHead>
                    <TableHead>Protein (g)</TableHead>
                    <TableHead>Carbs (g)</TableHead>
                    <TableHead>Fat (g)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.ingredient}</TableCell>
                      <TableCell>{item.amount}</TableCell>
                      <TableCell>{item.calories}</TableCell>
                      <TableCell>{item.protein}</TableCell>
                      <TableCell>{item.carbs}</TableCell>
                      <TableCell>{item.fat}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={2} className="font-bold">
                      Total
                    </TableCell>
                    <TableCell className="font-bold">{results.reduce((sum, item) => sum + item.calories, 0)}</TableCell>
                    <TableCell className="font-bold">{results.reduce((sum, item) => sum + item.protein, 0)}</TableCell>
                    <TableCell className="font-bold">{results.reduce((sum, item) => sum + item.carbs, 0)}</TableCell>
                    <TableCell className="font-bold">{results.reduce((sum, item) => sum + item.fat, 0)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-20rem)] min-h-[400px] text-center">
                <p className="text-muted-foreground mb-2">No analysis results yet</p>
                <p className="text-sm text-muted-foreground">
                  Upload an image and click "Analyze" to see nutritional information
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
