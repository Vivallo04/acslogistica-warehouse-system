/**
 * MongoDB Atlas Connection Utility
 * Manages database connections for feedback and issue tracking
 */

interface FeedbackDocument {
  _id?: string
  type: string
  subject: string
  message: string
  rating: number
  email: string
  userRole: string
  environment: any
  status: 'new' | 'reviewing' | 'resolved'
  createdAt: Date
  updatedAt: Date
}

interface IssueDocument {
  _id?: string
  issueId: string
  type: string
  priority: string
  title: string
  description: string
  stepsToReproduce?: string
  expectedBehavior?: string
  actualBehavior?: string
  email: string
  userRole: string
  environment: any
  status: 'new' | 'investigating' | 'resolved' | 'closed'
  createdAt: Date
  updatedAt: Date
}

class MongoDB {
  private static instance: MongoDB
  private client: any = null
  private db: any = null
  private isConnected: boolean = false

  private constructor() {}

  static getInstance(): MongoDB {
    if (!MongoDB.instance) {
      MongoDB.instance = new MongoDB()
    }
    return MongoDB.instance
  }

  async connect(): Promise<void> {
    if (this.isConnected && this.client && this.db) {
      return // Already connected
    }

    try {
      // Dynamic import to handle cases where mongodb package isn't installed yet
      let MongoClient
      try {
        const mongodb = await import('mongodb')
        MongoClient = mongodb.MongoClient
      } catch (importError) {
        console.warn('MongoDB package not installed yet. Install with: yarn add mongodb')
        // Fallback to console logging for now
        this.isConnected = false
        return
      }

      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
      const dbName = process.env.MONGODB_DB_NAME || 'acslogistica-feedback'
      
      console.log('Connecting to MongoDB Atlas...')
      
      this.client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      
      await this.client.connect()
      this.db = this.client.db(dbName)
      this.isConnected = true
      
      console.log('Successfully connected to MongoDB Atlas')
      
      // Test the connection
      await this.db.admin().ping()
      console.log('MongoDB Atlas connection verified')
      
    } catch (error) {
      console.error('MongoDB Atlas connection error:', error)
      this.isConnected = false
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.db = null
      this.isConnected = false
      console.log('Disconnected from MongoDB Atlas')
    }
  }

  async saveFeedback(feedback: Omit<FeedbackDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    await this.connect()
    
    if (!this.isConnected) {
      // Fallback if MongoDB isn't available
      const feedbackId = 'feedback_' + Date.now()
      console.log('MongoDB not available - logging feedback:', { ...feedback, feedbackId })
      return feedbackId
    }

    try {
      const collection = this.db.collection('feedback')
      const document: FeedbackDocument = {
        ...feedback,
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await collection.insertOne(document)
      console.log('Feedback saved to MongoDB Atlas:', result.insertedId.toString())
      
      return result.insertedId.toString()
    } catch (error) {
      console.error('Error saving feedback to MongoDB Atlas:', error)
      throw error
    }
  }

  async saveIssue(issue: Omit<IssueDocument, '_id' | 'issueId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    await this.connect()
    
    // Generate issue ID
    const issueId = 'ISS-' + Date.now().toString().slice(-6)
    
    if (!this.isConnected) {
      // Fallback if MongoDB isn't available
      console.log('MongoDB not available - logging issue:', { ...issue, issueId })
      return issueId
    }

    try {
      const collection = this.db.collection('issues')
      const document: IssueDocument = {
        ...issue,
        issueId,
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await collection.insertOne(document)
      console.log('Issue saved to MongoDB Atlas:', issueId)
      
      return issueId
    } catch (error) {
      console.error('Error saving issue to MongoDB Atlas:', error)
      throw error
    }
  }

  async getFeedback(limit = 50): Promise<FeedbackDocument[]> {
    await this.connect()
    
    if (!this.isConnected) {
      return []
    }

    try {
      const collection = this.db.collection('feedback')
      const feedback = await collection
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray()
      
      return feedback
    } catch (error) {
      console.error('Error fetching feedback from MongoDB Atlas:', error)
      return []
    }
  }

  async getIssues(limit = 50): Promise<IssueDocument[]> {
    await this.connect()
    
    if (!this.isConnected) {
      return []
    }

    try {
      const collection = this.db.collection('issues')
      const issues = await collection
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray()
      
      return issues
    } catch (error) {
      console.error('Error fetching issues from MongoDB Atlas:', error)
      return []
    }
  }

  async getConnectionStatus(): Promise<{ connected: boolean, message: string }> {
    try {
      await this.connect()
      
      if (!this.isConnected) {
        return { connected: false, message: 'MongoDB package not available' }
      }

      // Test connection with ping
      await this.db.admin().ping()
      return { connected: true, message: 'Connected to MongoDB Atlas' }
    } catch (error) {
      return { 
        connected: false, 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }
}

export const mongodb = MongoDB.getInstance()
export type { FeedbackDocument, IssueDocument }