import { collection, addDoc, doc, updateDoc, getDoc, setDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

class UserProfileService {
  constructor() {
    this.profilesCollection = 'userProfiles';
  }

  // Create or update user profile with details from image verification
  async createOrUpdateProfile(email, profileData = {}) {
    try {
      const profileRef = doc(db, this.profilesCollection, email);
      const existingProfile = await getDoc(profileRef);
      
      const now = new Date();
      const profileInfo = {
        email: email,
        userId: email,
        lastUpdated: serverTimestamp(),
        ...profileData
      };

      if (existingProfile.exists()) {
        // Update existing profile
        await updateDoc(profileRef, {
          ...profileInfo,
          updatedAt: serverTimestamp()
        });
        console.log('User profile updated:', email);
      } else {
        // Create new profile
        await setDoc(profileRef, {
          ...profileInfo,
          createdAt: serverTimestamp(),
          firstVerificationDate: now.toISOString().split('T')[0],
          totalVerifications: 0,
          lastVerificationDate: null
        });
        console.log('User profile created:', email);
      }

      return profileRef.id;
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      throw error;
    }
  }

  // Update profile with verification details
  async updateVerificationDetails(email, verificationData) {
    try {
      const profileRef = doc(db, this.profilesCollection, email);
      const profileDoc = await getDoc(profileRef);
      
      if (!profileDoc.exists()) {
        // Create profile if it doesn't exist
        await this.createOrUpdateProfile(email, verificationData);
        return;
      }

      const currentData = profileDoc.data();
      const now = new Date();
      
      const updatedData = {
        lastVerificationDate: now.toISOString().split('T')[0],
        lastVerificationTime: now.toISOString(),
        totalVerifications: (currentData.totalVerifications || 0) + 1,
        lastMealType: verificationData.mealType,
        lastVerificationMethod: verificationData.method || 'email_verification',
        updatedAt: serverTimestamp(),
        ...verificationData
      };

      await updateDoc(profileRef, updatedData);
      console.log('Verification details updated for:', email);
      
      return profileRef.id;
    } catch (error) {
      console.error('Error updating verification details:', error);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile(email) {
    try {
      const profileRef = doc(db, this.profilesCollection, email);
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        return { id: profileDoc.id, ...profileDoc.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Get all user profiles
  async getAllProfiles() {
    try {
      const profilesQuery = query(collection(db, this.profilesCollection));
      const querySnapshot = await getDocs(profilesQuery);
      
      const profiles = [];
      querySnapshot.forEach((doc) => {
        profiles.push({ id: doc.id, ...doc.data() });
      });
      
      return profiles;
    } catch (error) {
      console.error('Error getting all profiles:', error);
      throw error;
    }
  }

  // Update profile with image details (for future image processing)
  async updateImageDetails(email, imageDetails) {
    try {
      const profileRef = doc(db, this.profilesCollection, email);
      
      const imageData = {
        imageProcessed: true,
        imageDetails: imageDetails,
        imageProcessedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await updateDoc(profileRef, imageData);
      console.log('Image details updated for:', email);
      
      return profileRef.id;
    } catch (error) {
      console.error('Error updating image details:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(email) {
    try {
      const profile = await this.getUserProfile(email);
      if (!profile) return null;

      // Calculate basic stats from profile data
      const stats = {
        totalVerifications: profile.totalVerifications || 0,
        firstVerificationDate: profile.firstVerificationDate,
        lastVerificationDate: profile.lastVerificationDate,
        lastMealType: profile.lastMealType,
        accountAge: profile.createdAt ? 
          Math.floor((new Date() - profile.createdAt.toDate()) / (1000 * 60 * 60 * 24)) : 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
}

const userProfileService = new UserProfileService();
export default userProfileService;