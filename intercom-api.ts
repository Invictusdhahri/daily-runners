import fetch from 'node-fetch';

export interface IntercomUser {
  id: string;
  type: 'user' | 'contact';
  email?: string;
  last_seen_at?: number;
  name?: string;
}

export interface IntercomAdmin {
  id: string;
  type: 'admin';
}

export interface IntercomApiOptions {
  batchSize?: number;
  maxPages?: number;
  rateLimitDelay?: number;
  debug?: boolean;
}

export class IntercomApi {
  private readonly token: string;
  private readonly adminId: string;
  private readonly baseUrl = 'https://api.intercom.io';
  private rateLimitDelay = 50; // ms between requests to avoid rate limiting
  private batchSize = 150; // default batch size
  private maxPages = 0; // 0 means fetch all pages
  private debug = false;

  constructor(token: string, adminId: string, options?: IntercomApiOptions) {
    if (!token) throw new Error('Intercom token is required');
    if (!adminId) throw new Error('Admin ID is required');
    
    this.token = token;
    this.adminId = adminId;
    
    // Apply options if provided
    if (options) {
      if (options.rateLimitDelay !== undefined) this.rateLimitDelay = options.rateLimitDelay;
      if (options.batchSize !== undefined) this.batchSize = options.batchSize;
      if (options.maxPages !== undefined) this.maxPages = options.maxPages;
      if (options.debug !== undefined) this.debug = options.debug;
    }
    
    if (this.debug) {
      console.log(`IntercomApi initialized with options:
      - Admin ID: ${this.adminId}
      - Batch size: ${this.batchSize}
      - Rate limit delay: ${this.rateLimitDelay}ms
      - Max pages: ${this.maxPages === 0 ? 'All' : this.maxPages}`);
    }
  }

  /**
   * Send an in-app message to a single user
   */
  async sendInAppMessage(userId: string, body: string): Promise<any> {
    const url = `${this.baseUrl}/messages`;
    const payload = {
      message_type: 'inapp',
      body,
      from: { type: 'admin', id: this.adminId },
      to: { type: 'user', id: userId }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Intercom API error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to send message to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send a message to a user - alias for sendInAppMessage
   */
  async sendMessage(userId: string, message: string): Promise<any> {
    return this.sendInAppMessage(userId, message);
  }

  /**
   * List all users from Intercom using the contacts API
   */
  async listAllUsers(): Promise<IntercomUser[]> {
    if (this.debug) {
      console.log('Starting to fetch all users from contacts API...');
    }

    let allUsers: IntercomUser[] = [];
    let nextPageUrl = `${this.baseUrl}/contacts?per_page=${this.batchSize}`;
    let pageCount = 0;

    while (nextPageUrl && (this.maxPages === 0 || pageCount < this.maxPages)) {
      try {
        if (this.debug) {
          console.log(`Fetching users page ${pageCount + 1}: ${nextPageUrl}`);
        }
        
        const response = await fetch(nextPageUrl, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Intercom API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        // Add users from current page
        const users = (data.data || [])
          .filter((contact: any) => contact.role === 'user')
          .map((user: any) => ({
            id: user.id,
            type: user.type || 'contact',
            email: user.email,
            name: user.name,
            last_seen_at: user.last_seen_at
          }));
        
        allUsers = [...allUsers, ...users];
        
        pageCount++;
        
        if (this.debug) {
          console.log(`Retrieved ${users.length} users from page ${pageCount}. Total so far: ${allUsers.length}`);
        }
        
        // Check if there's a next page - handle pagination properly
        nextPageUrl = '';
        
        if (data.pages && data.pages.next) {
          const nextPage = data.pages.next;
          
          // Handle different response formats
          if (typeof nextPage === 'string') {
            if (nextPage.startsWith('http')) {
              nextPageUrl = nextPage;
            } else if (nextPage.startsWith('/')) {
              nextPageUrl = `${this.baseUrl}${nextPage}`;
            }
          } else if (nextPage && typeof nextPage === 'object' && nextPage.url) {
            nextPageUrl = typeof nextPage.url === 'string' && nextPage.url.startsWith('http') 
              ? nextPage.url 
              : `${this.baseUrl}${nextPage.url}`;
          }
          
          if (this.debug) {
            console.log(`Next page URL: ${nextPageUrl || 'None'}`);
          }
        }
        
        // Add delay to avoid rate limiting
        if (nextPageUrl) {
          await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
    }
    
    if (this.debug) {
      console.log(`Completed user fetch. Retrieved ${allUsers.length} users in ${pageCount} pages.`);
    }
    
    return allUsers;
  }
  
  /**
   * Get active users directly from Intercom using the contacts search API
   */
  async listActiveUsers(days: number = 30): Promise<IntercomUser[]> {
    if (this.debug) {
      console.log(`Fetching users active in the last ${days} days`);
    }
    
    // Calculate the timestamp for X days ago
    const now = Math.floor(Date.now() / 1000);
    const cutoffTime = now - (days * 24 * 60 * 60);
    
    try {
      if (this.debug) {
        console.log(`Current time (unix): ${now}`);
        console.log(`Cutoff time (unix): ${cutoffTime}`);
        console.log(`Looking for users active since ${new Date(cutoffTime * 1000)}`);
      }
      
      // First, try to use the "Active" segment if it exists
      try {
        const activeSegmentId = await this.getActiveSegmentId();
        
        if (activeSegmentId) {
          if (this.debug) {
            console.log(`Found Active segment with ID: ${activeSegmentId}, using that to fetch active users`);
          }
          
          return await this.getUsersBySegment(activeSegmentId);
        }
      } catch (error) {
        if (this.debug) {
          console.log('Could not find or use Active segment, falling back to last_seen_at search');
        }
      }
      
      // If segment approach doesn't work, fall back to search by last_seen_at
      let allActiveUsers: IntercomUser[] = [];
      let nextPageUrl = `${this.baseUrl}/contacts/search`;
      let pageCount = 0;
      
      while (nextPageUrl && (this.maxPages === 0 || pageCount < this.maxPages)) {
        try {
          if (this.debug) {
            console.log(`Fetching active users page ${pageCount + 1}`);
          }
          
          // Create search query for users active since cutoff time
          const payload = {
            query: {
              field: "last_seen_at",
              operator: ">",
              value: cutoffTime
            },
            pagination: {
              per_page: this.batchSize
            }
          };
          
          // If it's not the first page, we'll use the nextPageUrl
          const isFirstPage = pageCount === 0;
          
          const response = await fetch(nextPageUrl, {
            method: isFirstPage ? 'POST' : 'GET',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            ...(isFirstPage && { body: JSON.stringify(payload) })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Intercom API error (${response.status}): ${errorText}`);
          }
          
          const data = await response.json();
          
          // Process the active users from the current page
          const users = (data.data || [])
            .filter((contact: any) => contact.role === 'user')
            .map((user: any) => ({
              id: user.id,
              type: user.type || 'contact',
              email: user.email,
              name: user.name,
              last_seen_at: user.last_seen_at
            }));
          
          allActiveUsers = [...allActiveUsers, ...users];
          
          pageCount++;
          
          if (this.debug) {
            console.log(`Retrieved ${users.length} active users from page ${pageCount}`);
            console.log(`Total active users so far: ${allActiveUsers.length}`);
          }
          
          // Reset next page URL
          nextPageUrl = '';
          
          // Check if there's a next page - safely handle different response formats
          if (data.pages) {
            const nextPage = data.pages.next;
            
            if (nextPage) {
              // If it's a string URL
              if (typeof nextPage === 'string') {
                if (nextPage.startsWith('http')) {
                  nextPageUrl = nextPage;
                } else if (nextPage.startsWith('/')) {
                  nextPageUrl = `${this.baseUrl}${nextPage}`;
                }
              } 
              // If it's an object with a URL property
              else if (nextPage && typeof nextPage === 'object' && nextPage.url) {
                nextPageUrl = typeof nextPage.url === 'string' && nextPage.url.startsWith('http') 
                  ? nextPage.url 
                  : `${this.baseUrl}${nextPage.url}`;
              }
            }
            
            if (this.debug) {
              console.log(`Next page URL: ${nextPageUrl || 'None'}`);
            }
          }
          
          // Add delay to avoid rate limiting
          if (nextPageUrl) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
          }
          
        } catch (error) {
          console.error(`Error fetching active users page ${pageCount + 1}:`, error);
          throw error;
        }
      }
      
      if (this.debug) {
        console.log(`Completed active user fetch. Retrieved ${allActiveUsers.length} active users in ${pageCount} pages.`);
      }
      
      return allActiveUsers;
      
    } catch (error) {
      console.error('Error fetching active users:', error);
      throw error;
    }
  }
  
  /**
   * Find the ID of the "Active" segment if it exists
   */
  private async getActiveSegmentId(): Promise<string | null> {
    try {
      const segmentsResponse = await fetch(`${this.baseUrl}/segments`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!segmentsResponse.ok) {
        return null;
      }
      
      const segmentsData = await segmentsResponse.json();
      const segments = segmentsData.segments || [];
      
      // Find segment named "Active" (case-insensitive match)
      const activeSegment = segments.find((segment: any) => 
        segment.name && segment.name.toLowerCase() === 'active');
      
      return activeSegment ? activeSegment.id : null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Get users from a specific segment
   */
  private async getUsersBySegment(segmentId: string): Promise<IntercomUser[]> {
    let allUsers: IntercomUser[] = [];
    let nextPageUrl = `${this.baseUrl}/contacts/search`;
    let pageCount = 0;
    
    while (nextPageUrl && (this.maxPages === 0 || pageCount < this.maxPages)) {
      try {
        if (this.debug) {
          console.log(`Fetching users from segment ${segmentId}, page ${pageCount + 1}`);
        }
        
        // Create search query for users in the segment
        const payload = {
          query: {
            field: "segment_id",
            operator: "=",
            value: segmentId
          },
          pagination: {
            per_page: this.batchSize
          }
        };
        
        // If it's not the first page, we'll use the nextPageUrl
        const isFirstPage = pageCount === 0;
        
        const response = await fetch(nextPageUrl, {
          method: isFirstPage ? 'POST' : 'GET',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          ...(isFirstPage && { body: JSON.stringify(payload) })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Intercom API error (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        
        // Process users from the current page
        const users = (data.data || [])
          .filter((contact: any) => contact.role === 'user')
          .map((user: any) => ({
            id: user.id,
            type: user.type || 'contact',
            email: user.email,
            name: user.name,
            last_seen_at: user.last_seen_at
          }));
        
        allUsers = [...allUsers, ...users];
        
        pageCount++;
        
        if (this.debug) {
          console.log(`Retrieved ${users.length} users from segment page ${pageCount}`);
          console.log(`Total segment users so far: ${allUsers.length}`);
        }
        
        // Reset next page URL
        nextPageUrl = '';
        
        // Check if there's a next page - safely handle different response formats
        if (data.pages) {
          const nextPage = data.pages.next;
          
          if (nextPage) {
            // If it's a string URL
            if (typeof nextPage === 'string') {
              if (nextPage.startsWith('http')) {
                nextPageUrl = nextPage;
              } else if (nextPage.startsWith('/')) {
                nextPageUrl = `${this.baseUrl}${nextPage}`;
              }
            } 
            // If it's an object with a URL property
            else if (nextPage && typeof nextPage === 'object' && nextPage.url) {
              nextPageUrl = typeof nextPage.url === 'string' && nextPage.url.startsWith('http') 
                ? nextPage.url 
                : `${this.baseUrl}${nextPage.url}`;
            }
          }
          
          if (this.debug) {
            console.log(`Next page URL: ${nextPageUrl || 'None'}`);
          }
        }
        
        // Add delay to avoid rate limiting
        if (nextPageUrl) {
          await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
        }
        
      } catch (error) {
        console.error(`Error fetching segment users page ${pageCount + 1}:`, error);
        throw error;
      }
    }
    
    if (this.debug) {
      console.log(`Completed segment user fetch. Retrieved ${allUsers.length} users in ${pageCount} pages.`);
    }
    
    return allUsers;
  }
} 