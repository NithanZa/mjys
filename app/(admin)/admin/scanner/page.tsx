"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { Button, Card, CardHeader, CardBody, Input, Badge } from "@/components/ui";
import {
  Camera,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Volume2,
  VolumeX,
  Sparkles,
  User,
  History,
  AlertTriangle,
  RotateCcw,
  Check,
} from "lucide-react";
import { playSuccessBeep, playErrorBeep } from "@/lib/audio";
import { AnimatePresence, motion } from "motion/react";

interface CameraDevice {
  id: string;
  label: string;
}

interface Member {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  classesAttended: number;
  level: string;
}

interface CheckInResponse {
  success: boolean;
  member: Member;
  booking: {
    id: string;
    checkedInAt: string;
    status: string;
  };
  classOccurrence: {
    startsAt: string;
    template: {
      name: string;
    };
    instructor: {
      name: string;
    };
  };
  unlockedMilestones: string[];
  newLevelCrossed: string | null;
}

export default function AdminScannerPage() {
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [scannerInstance, setScannerInstance] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Status and Overlays
  const [verifying, setVerifying] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInResponse | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);

  // Manual search states
  const [manualQuery, setManualQuery] = useState("");
  const [manualResults, setManualResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [manualError, setManualQueryError] = useState<string | null>(null);

  // Reference for scanning status to prevent multiple rapid scans
  const isVerifyingRef = useRef(false);

  // Dynamically import html5-qrcode
  const Html5QrcodeRef = useRef<any>(null);

  useEffect(() => {
    // @ts-ignore
    import("html5-qrcode")
      .then((lib) => {
        Html5QrcodeRef.current = lib.Html5Qrcode;
        // List cameras as soon as library is loaded
        lib.Html5Qrcode.getCameras()
          .then((devices: any[]) => {
            if (devices && devices.length > 0) {
              setCameras(devices.map((d: any) => ({ id: d.id, label: d.label || `Camera ${devices.indexOf(d) + 1}` })));
              setSelectedCameraId(devices[0].id);
            } else {
              setCameraPermissionError("No camera devices found. Ensure a webcam is connected.");
            }
          })
          .catch((err: any) => {
            console.error("Failed to list cameras:", err);
            setCameraPermissionError("Camera access denied or unavailable. Please check system permissions.");
          });
      })
      .catch((err: any) => {
        console.error("Failed to load html5-qrcode:", err);
      });

    return () => {
      // Clean up scanner on unmount
      if (scannerInstance) {
        try {
          if (scannerInstance.isScanning) {
            scannerInstance.stop().catch(console.error);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, []);

  // Handle manual member search input change
  useEffect(() => {
    if (activeTab !== "manual") return;
    if (manualQuery.trim().length < 2) {
      setManualResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setManualQueryError(null);
      try {
        const res = await fetch(`/api/admin/members?q=${encodeURIComponent(manualQuery)}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setManualResults(data.members || []);
      } catch (err) {
        console.error("Manual search error:", err);
        setManualQueryError("Failed to search members.");
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [manualQuery, activeTab]);

  // Start the camera scanning
  const startScanning = async (cameraId: string) => {
    if (!Html5QrcodeRef.current || !cameraId) return;

    try {
      // Stop existing if any
      if (scannerInstance) {
        try {
          await scannerInstance.stop();
        } catch (e) {}
      }

      setCameraPermissionError(null);
      setScanError(null);

      const qrcode = new Html5QrcodeRef.current("scanner-viewfinder");
      setScannerInstance(qrcode);
      setScanning(true);

      await qrcode.start(
        cameraId,
        {
          fps: 10,
          qrbox: (width: number, height: number) => {
            const minDim = Math.min(width, height);
            const boxSize = Math.floor(minDim * 0.7);
            return { width: boxSize, height: boxSize };
          },
        },
        async (decodedText: string) => {
          await verifyToken(decodedText, null, qrcode);
        },
        (errorMessage: string) => {
          // Ignore verbose scanner framing logs
        }
      );
    } catch (err: any) {
      console.error("Failed to start camera scanner:", err);
      setCameraPermissionError(err.message || "Failed to start camera. Please ensure permissions are granted.");
      setScanning(false);
    }
  };

  // Stop scanning
  const stopScanning = async () => {
    if (scannerInstance) {
      try {
        await scannerInstance.stop();
      } catch (err) {
        console.error("Error stopping camera scanner:", err);
      }
      setScannerInstance(null);
      setScanning(false);
    }
  };

  // Switch scanning camera
  const handleCameraChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCameraId = e.target.value;
    setSelectedCameraId(newCameraId);
    if (scanning) {
      await startScanning(newCameraId);
    }
  };

  // Verify function
  const verifyToken = async (token: string | null, forceMemberId: string | null, activeScanner: any = null) => {
    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;

    setVerifying(true);
    setScanError(null);
    setCheckInResult(null);

    // If scanner is active, pause scanning or stop it while verifying
    if (activeScanner) {
      try {
        await activeScanner.pause();
      } catch (e) {
        console.error("Failed to pause scanner:", e);
      }
    }

    try {
      const response = await fetch("/api/admin/scanner/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, forceMemberId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An unknown error occurred during check-in.");
      }

      // Success
      if (soundEnabled) playSuccessBeep();
      setCheckInResult(data as CheckInResponse);
    } catch (err: any) {
      console.error("Verification error:", err);
      if (soundEnabled) playErrorBeep();
      setScanError(err.message || "Check-in failed. Please try again.");
    } finally {
      setVerifying(false);
      isVerifyingRef.current = false;
    }
  };

  // Resume scanning after result modal closes
  const handleCloseOverlay = async () => {
    setCheckInResult(null);
    setScanError(null);

    if (scannerInstance && scanning) {
      try {
        await scannerInstance.resume();
      } catch (err) {
        console.error("Failed to resume scanner:", err);
        // Fallback restart
        await startScanning(selectedCameraId);
      }
    }
  };

  // Trigger manual check-in on a member
  const handleManualCheckIn = async (memberId: string) => {
    await verifyToken(null, memberId);
  };

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6 max-w-4xl mx-auto font-sans h-full min-h-[calc(100vh-3.5rem)] md:min-h-screen">
      {/* Top Header */}
      <div className="flex justify-between items-center shrink-0 border-b border-neutral-line pb-4">
        <div>
          <h1 className="font-display text-h1 font-semibold text-neutral-ink">
            On-Day Check-In Desk
          </h1>
          <p className="text-body-sm text-neutral-text-2">
            Scan Member Pass QR or check-in members manually.
          </p>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={cn(
            "grid h-11 w-11 place-items-center rounded-sm border transition-colors",
            soundEnabled
              ? "bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100"
              : "bg-neutral-card border-neutral-line text-neutral-text-3 hover:bg-neutral-line/20"
          )}
          title={soundEnabled ? "Mute beep sound" : "Unmute beep sound"}
        >
          {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex border border-neutral-line rounded-sm p-1 bg-neutral-line/20 shrink-0">
        <button
          onClick={async () => {
            setActiveTab("camera");
            setManualQuery("");
            setManualResults([]);
          }}
          className={cn(
            "flex-1 py-2 text-center rounded-sm font-sans text-body-sm font-medium transition-all duration-150",
            activeTab === "camera"
              ? "bg-neutral-card text-neutral-ink shadow-sm font-semibold"
              : "text-neutral-text-2 hover:text-primary-700"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <Camera className="h-4 w-4" /> Camera Scan
          </span>
        </button>
        <button
          onClick={async () => {
            setActiveTab("manual");
            await stopScanning();
          }}
          className={cn(
            "flex-1 py-2 text-center rounded-sm font-sans text-body-sm font-medium transition-all duration-150",
            activeTab === "manual"
              ? "bg-neutral-card text-neutral-ink shadow-sm font-semibold"
              : "text-neutral-text-2 hover:text-primary-700"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <Search className="h-4 w-4" /> Manual Search
          </span>
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === "camera" ? (
            <motion.div
              key="camera-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col gap-6"
            >
              {/* Camera Selector and Start Button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedCameraId}
                  onChange={handleCameraChange}
                  disabled={cameras.length === 0}
                  className="flex-1 h-11 px-3 rounded-sm bg-neutral-card border border-neutral-line text-neutral-text focus-visible:outline-primary-500 disabled:opacity-50 font-sans text-body-sm"
                >
                  {cameras.length === 0 ? (
                    <option value="">No cameras available</option>
                  ) : (
                    cameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label}
                      </option>
                    ))
                  )}
                </select>

                <Button
                  onClick={scanning ? stopScanning : () => startScanning(selectedCameraId)}
                  variant={scanning ? "secondary" : "primary"}
                  disabled={cameras.length === 0}
                  className="h-11 px-6 font-semibold flex items-center justify-center gap-2"
                >
                  {scanning ? (
                    <>
                      <XCircle className="h-5 w-5" /> Stop Camera
                    </>
                  ) : (
                    <>
                      <Camera className="h-5 w-5" /> Start Scanner
                    </>
                  )}
                </Button>
              </div>

              {/* Viewfinder Container */}
              <div className="flex-1 flex flex-col items-center justify-center bg-neutral-ink text-neutral-bg rounded-lg overflow-hidden border border-neutral-line relative min-h-[300px] shadow-inner">
                {cameraPermissionError ? (
                  <div className="p-6 text-center flex flex-col items-center gap-3 max-w-sm">
                    <AlertTriangle className="h-10 w-10 text-warning-fg" />
                    <h3 className="font-display text-h3 font-semibold text-neutral-bg">Camera Error</h3>
                    <p className="font-sans text-caption text-neutral-text-3">{cameraPermissionError}</p>
                    <Button
                      variant="primary"
                      onClick={async () => {
                        try {
                          if (Html5QrcodeRef.current) {
                            const devices = await Html5QrcodeRef.current.getCameras();
                            if (devices && devices.length > 0) {
                              setCameras(devices.map((d: any) => ({ id: d.id, label: d.label || `Camera ${devices.indexOf(d) + 1}` })));
                              setSelectedCameraId(devices[0].id);
                              setCameraPermissionError(null);
                            }
                          }
                        } catch (e) {
                          console.error("Camera retry failed:", e);
                        }
                      }}
                      className="mt-2 text-neutral-ink font-semibold"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" /> Retry Camera Check
                    </Button>
                  </div>
                ) : scanning ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    {/* HTML5 Qrcode Mount Point */}
                    <div id="scanner-viewfinder" className="w-full max-w-md h-full aspect-square" />
                    
                    {/* Scanner Framing Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="text-neutral-bg/60 text-caption bg-neutral-ink/80 px-4 py-1.5 rounded-full mb-4 flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Align Member Pass QR inside the box
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center flex flex-col items-center gap-3 max-w-sm text-neutral-text-3">
                    <Camera className="h-12 w-12 text-neutral-text-3 opacity-40" />
                    <p className="font-sans text-body-sm">
                      Camera is offline. Click &quot;Start Scanner&quot; above to initialize check-in mode.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="manual-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col gap-6"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-text-3 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search member by Name, Phone, or Email..."
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  className="pl-10 h-11 rounded-sm border-neutral-line focus-visible:outline-primary-500 font-sans text-body-sm"
                  autoFocus
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
                  </div>
                )}
              </div>

              {manualError && (
                <div className="p-4 bg-error-bg/10 border border-error-border rounded-sm text-error-fg text-body-sm flex gap-2">
                  <XCircle className="h-5 w-5 shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}

              {/* Members Results List */}
              <div className="flex-1 overflow-y-auto max-h-[400px] border border-neutral-line rounded-sm bg-neutral-card divide-y divide-neutral-line">
                {manualResults.length > 0 ? (
                  manualResults.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-primary-50/20 transition-all duration-150"
                    >
                      <div>
                        <div className="font-display text-body font-semibold text-neutral-ink flex items-center gap-2">
                          {member.displayName}
                          <Badge tone="neutral" className="capitalize text-caption">
                            {member.level.toLowerCase()}
                          </Badge>
                        </div>
                        <div className="font-sans text-caption text-neutral-text-2 mt-1 space-y-0.5">
                          {member.phone && <p>Phone: {member.phone}</p>}
                          {member.email && <p>Email: {member.email}</p>}
                          <p className="text-neutral-text-3">Total Classes Attended: {member.classesAttended}</p>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleManualCheckIn(member.id)}
                        disabled={verifying}
                        variant="primary"
                        className="h-9 px-4 font-semibold text-caption shrink-0"
                      >
                        Check In Now
                      </Button>
                    </div>
                  ))
                ) : manualQuery.trim().length >= 2 && !searching ? (
                  <div className="p-8 text-center text-neutral-text-3 font-sans text-body-sm">
                    No registered members found matching &quot;{manualQuery}&quot;
                  </div>
                ) : (
                  <div className="p-8 text-center text-neutral-text-3 font-sans text-body-sm flex flex-col items-center gap-2">
                    <User className="h-10 w-10 opacity-30" />
                    <p>Type at least 2 characters to search the directory.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full-Screen / Boxed Success & Error Feedback Overlay */}
      <AnimatePresence>
        {(checkInResult || scanError || verifying) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-ink/60 px-4 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-neutral-bg rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-neutral-line flex flex-col"
            >
              {/* VERIFYING LOADER */}
              {verifying && (
                <div className="p-8 text-center flex flex-col items-center gap-4">
                  <Loader2 className="h-12 w-12 text-primary-500 animate-spin" />
                  <h3 className="font-display text-h3 font-semibold text-neutral-ink">Verifying Pass</h3>
                  <p className="font-sans text-body-sm text-neutral-text-2">
                    Checking database credentials and schedule bookings...
                  </p>
                </div>
              )}

              {/* SUCCESS STATE */}
              {checkInResult && (
                <div className="flex flex-col h-full">
                  {/* Top Success Banner */}
                  <div className="p-6 bg-primary-500 text-neutral-ink text-center flex flex-col items-center gap-2 shrink-0">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-700 text-primary-50 shadow-sm animate-bounce">
                      <Check className="h-6 w-6" strokeWidth={3} />
                    </div>
                    <h3 className="font-display text-h2 font-bold leading-tight">Check-In Successful!</h3>
                    <p className="font-sans text-caption opacity-90 uppercase tracking-wider font-semibold">
                      Welcome to the Studio
                    </p>
                  </div>

                  {/* Booking & Member Details */}
                  <div className="p-6 flex-1 overflow-y-auto space-y-4 max-h-[300px]">
                    <div className="border-b border-neutral-line pb-3">
                      <p className="text-caption text-neutral-text-3 font-semibold uppercase tracking-wider">Member</p>
                      <h4 className="font-display text-body-lg font-bold text-neutral-ink mt-0.5">
                        {checkInResult.member.displayName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge tone="neutral" className="capitalize text-caption">
                          {checkInResult.member.level.toLowerCase()} level
                        </Badge>
                        <span className="text-caption text-neutral-text-3">
                          • {checkInResult.member.classesAttended} classes attended
                        </span>
                      </div>
                    </div>

                    <div className="border-b border-neutral-line pb-3">
                      <p className="text-caption text-neutral-text-3 font-semibold uppercase tracking-wider">Scheduled Class</p>
                      <h4 className="font-display text-body font-bold text-neutral-ink mt-0.5">
                        {checkInResult.classOccurrence.template.name}
                      </h4>
                      <p className="text-caption text-neutral-text-2 mt-0.5">
                        Instructor: {checkInResult.classOccurrence.instructor.name}
                      </p>
                      <p className="text-caption text-neutral-text-3 mt-0.5">
                        Today, {new Date(checkInResult.classOccurrence.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Milestones / Level up unlocked */}
                    {(checkInResult.unlockedMilestones.length > 0 || checkInResult.newLevelCrossed) && (
                      <div className="p-3.5 bg-primary-50 border border-primary-200 rounded-sm space-y-2">
                        <div className="flex items-center gap-2 text-primary-700 font-display text-body-sm font-semibold">
                          <Sparkles className="h-4 w-4 text-primary-600 animate-pulse" />
                          <span>Milestone Unlocked!</span>
                        </div>
                        <ul className="text-caption text-neutral-text-2 list-disc pl-5 space-y-1">
                          {checkInResult.unlockedMilestones.map((m) => (
                            <li key={m}>
                              Unlocked: <strong>{m}</strong>
                            </li>
                          ))}
                          {checkInResult.newLevelCrossed && (
                            <li>
                              Level Up! Promoted to <strong className="capitalize">{checkInResult.newLevelCrossed.toLowerCase()}</strong>! 🎉
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-neutral-line shrink-0 bg-neutral-line/10 flex justify-end">
                    <Button
                      variant="primary"
                      onClick={handleCloseOverlay}
                      className="w-full sm:w-auto h-11 px-8 font-semibold text-neutral-ink shadow-sm"
                    >
                      Scan Next
                    </Button>
                  </div>
                </div>
              )}

              {/* ERROR STATE */}
              {scanError && (
                <div className="flex flex-col">
                  {/* Top Error Banner */}
                  <div className="p-6 bg-error-bg/10 border-b border-neutral-line text-center flex flex-col items-center gap-2">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-error-bg text-error-fg shadow-sm">
                      <XCircle className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <h3 className="font-display text-h2 font-bold text-error-fg leading-tight">Check-In Failed</h3>
                    <p className="font-sans text-caption text-neutral-text-3 font-semibold uppercase tracking-wider">
                      Validation Error
                    </p>
                  </div>

                  {/* Error Details */}
                  <div className="p-6 font-sans text-body text-neutral-text-2 text-center">
                    <p className="font-semibold text-neutral-ink">
                      {scanError}
                    </p>
                    <p className="text-caption text-neutral-text-3 mt-3">
                      Ask the customer to refresh their Member Pass page or complete their booking first.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="p-4 border-t border-neutral-line bg-neutral-line/10 flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={handleCloseOverlay}
                      className="w-full sm:w-auto h-11 px-8 font-semibold text-neutral-ink"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
