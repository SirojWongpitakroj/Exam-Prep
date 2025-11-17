import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

/**
 * Test Firestore connection and operations
 * Call this function from browser console to verify Firestore is working
 */
export const testFirestoreConnection = async () => {
  console.log("🔍 Testing Firestore connection...");
  
  try {
    // Test 1: Write a test document
    console.log("📝 Test 1: Writing test document...");
    const testData = {
      test: true,
      message: "Firestore connection test",
      timestamp: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(db, "connection_test"), testData);
    console.log("✅ Test 1 PASSED: Document written with ID:", docRef.id);
    
    // Test 2: Read the document back
    console.log("📖 Test 2: Reading documents...");
    const querySnapshot = await getDocs(collection(db, "connection_test"));
    console.log("✅ Test 2 PASSED: Found", querySnapshot.size, "document(s)");
    
    querySnapshot.forEach((doc) => {
      console.log("  Document ID:", doc.id);
      console.log("  Data:", doc.data());
    });
    
    // Test 3: Clean up - delete test documents
    console.log("🧹 Test 3: Cleaning up test documents...");
    const deletePromises: Promise<void>[] = [];
    querySnapshot.forEach((docSnapshot) => {
      deletePromises.push(deleteDoc(doc(db, "connection_test", docSnapshot.id)));
    });
    await Promise.all(deletePromises);
    console.log("✅ Test 3 PASSED: Test documents deleted");
    
    console.log("\n🎉 All tests PASSED! Firestore is configured correctly.");
    return true;
  } catch (error: any) {
    console.error("❌ Firestore test FAILED:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    // Provide helpful error messages
    if (error.code === "permission-denied") {
      console.error("\n⚠️  PERMISSION DENIED - Your Firestore security rules are blocking access.");
      console.error("📋 To fix: Deploy the firestore.rules file to Firebase");
      console.error("   Run: firebase deploy --only firestore:rules");
    } else if (error.code === "unavailable") {
      console.error("\n⚠️  FIRESTORE UNAVAILABLE - Check your internet connection");
    } else if (error.message.includes("projectId")) {
      console.error("\n⚠️  INVALID PROJECT ID - Check your .env file");
      console.error("   Make sure VITE_FIREBASE_PROJECT_ID is set correctly");
    }
    
    return false;
  }
};

/**
 * Test file upload to Firestore
 * Simulates uploading a file metadata
 */
export const testFileUpload = async (userId: string) => {
  console.log("🔍 Testing file upload to Firestore...");
  console.log("User ID:", userId);
  
  try {
    const testFileData = {
      fileName: "test-document.pdf",
      fileSize: "1.5 MB",
      fileType: "application/pdf",
      user_id: userId,
      userPlan: "free" as const,
      uploadedAt: new Date(),
      fileSizeMB: 1.5,
    };
    
    console.log("📝 Uploading test file metadata...");
    const docRef = await addDoc(collection(db, "uploaded_files"), testFileData);
    console.log("✅ File uploaded successfully with ID:", docRef.id);
    
    // Read it back
    console.log("📖 Reading uploaded files for user...");
    const querySnapshot = await getDocs(collection(db, "uploaded_files"));
    console.log("✅ Found", querySnapshot.size, "file(s) in database");
    
    // Clean up
    console.log("🧹 Cleaning up test file...");
    await deleteDoc(doc(db, "uploaded_files", docRef.id));
    console.log("✅ Test file deleted");
    
    console.log("\n🎉 File upload test PASSED!");
    return true;
  } catch (error: any) {
    console.error("❌ File upload test FAILED:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    return false;
  }
};

// Make functions available in browser console
if (typeof window !== 'undefined') {
  (window as any).testFirestoreConnection = testFirestoreConnection;
  (window as any).testFileUpload = testFileUpload;
  console.log("🔧 Firestore test functions loaded!");
  console.log("   Run: testFirestoreConnection() to test connection");
  console.log("   Run: testFileUpload('your-user-id') to test file upload");
}

