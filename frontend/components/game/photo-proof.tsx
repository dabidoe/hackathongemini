"use client"

import { useState, useRef } from "react"
import { Camera, X, Upload, CheckCircle, RotateCcw, Scan } from "lucide-react"
import { GlassPanel } from "./glass-panel"
import { Button } from "@/components/ui/button"

interface PhotoProofProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (photoUrl: string) => void
  objective: string
  hint?: string
  isSubmitting?: boolean
}

export function PhotoProof({ 
  isOpen, 
  onClose, 
  onSubmit, 
  objective,
  hint,
  isSubmitting = false
}: PhotoProofProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCapturedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVerify = async () => {
    setIsVerifying(true)
    // Simulate AI verification
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsVerifying(false)
    setIsVerified(true)
  }

  const handleSubmit = () => {
    if (capturedImage) {
      onSubmit(capturedImage)
      handleReset()
      onClose()
    }
  }

  const handleReset = () => {
    setCapturedImage(null)
    setIsVerifying(false)
    setIsVerified(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md pointer-events-auto">
      <GlassPanel 
        className="w-full max-w-sm animate-in zoom-in-95 duration-200"
        variant="strong"
        glowColor="magenta"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono text-foreground uppercase tracking-wider">
              Photo Verification
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Objective */}
        <div className="p-3 border-b border-border bg-muted/30">
          <span className="text-[10px] font-mono text-accent uppercase">Objective</span>
          <p className="text-sm font-mono text-foreground mt-0.5">{objective}</p>
          {hint && (
            <p className="text-[10px] font-mono text-muted-foreground mt-1">
              Hint: {hint}
            </p>
          )}
        </div>

        {/* Photo Area */}
        <div className="p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {!capturedImage ? (
            <button
              onClick={handleCapture}
              className="w-full aspect-[4/3] border-2 border-dashed border-accent/50 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-accent hover:bg-accent/5 transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
                <Camera className="w-7 h-7 text-accent" />
              </div>
              <div className="text-center">
                <span className="text-sm font-mono text-foreground block">
                  Tap to Capture
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Take a photo as proof
                </span>
              </div>
            </button>
          ) : (
            <div className="relative">
              <img 
                src={capturedImage} 
                alt="Captured proof"
                className="w-full aspect-[4/3] object-cover rounded-lg"
              />
              
              {/* Scanning Overlay */}
              {isVerifying && (
                <div className="absolute inset-0 bg-background/60 rounded-lg flex flex-col items-center justify-center">
                  <Scan className="w-12 h-12 text-accent animate-pulse" />
                  <span className="text-xs font-mono text-accent mt-2">
                    ANALYZING IMAGE...
                  </span>
                  <div className="absolute inset-x-0 h-0.5 bg-accent/80 animate-scan top-0" 
                       style={{ animation: 'scan 1.5s ease-in-out infinite' }} />
                </div>
              )}

              {/* Verified Badge */}
              {isVerified && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-neon-green/20 border border-neon-green rounded-full px-2 py-1">
                  <CheckCircle className="w-3 h-3 text-neon-green" />
                  <span className="text-[10px] font-mono text-neon-green">VERIFIED</span>
                </div>
              )}

              {/* Reset Button */}
              {!isVerifying && (
                <button
                  onClick={handleReset}
                  className="absolute top-2 left-2 p-1.5 rounded-full bg-background/80 border border-border hover:border-destructive transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-3 pt-0 flex gap-2">
          {!capturedImage ? (
            <Button 
              variant="outline" 
              className="flex-1 font-mono text-xs border-border"
              onClick={onClose}
            >
              Cancel
            </Button>
          ) : !isVerified ? (
            <>
              <Button 
                variant="outline" 
                className="flex-1 font-mono text-xs border-border"
                onClick={handleReset}
                disabled={isVerifying}
              >
                Retake
              </Button>
              <Button 
                className="flex-1 font-mono text-xs bg-accent/20 border border-accent text-accent hover:bg-accent/30"
                onClick={handleVerify}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Scan className="w-3 h-3 mr-1.5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Scan className="w-3 h-3 mr-1.5" />
                    Verify
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button 
              className="flex-1 font-mono text-xs bg-neon-green/20 border border-neon-green text-neon-green hover:bg-neon-green/30 disabled:opacity-50"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Upload className="w-3 h-3 mr-1.5 animate-pulse" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3 mr-1.5" />
                  Submit Proof
                </>
              )}
            </Button>
          )}
        </div>

        {/* Status */}
        <div className="px-3 py-2 border-t border-border">
          <span className="text-[10px] font-mono text-muted-foreground">
            AI_VERIFICATION: <span className={isVerified ? 'text-neon-green' : 'text-accent'}>
              {isVerified ? 'COMPLETE' : 'PENDING'}
            </span>
          </span>
        </div>
      </GlassPanel>
    </div>
  )
}
