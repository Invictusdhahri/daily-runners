import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import { IntercomApi } from './intercom-api';

// Load environment variables
dotenv.config();

async function debugIntercomUsers() {
  console.log('====== DEBUGGING INTERCOM USER FETCHING ======');
  
  // Check environment variables
  const token = process.env.INTERCOM_TOKEN;
  const adminId = process.env.INTERCOM_ADMIN_ID;
  
  if (!token || !adminId) {
    console.error('Missing required environment variables: INTERCOM_TOKEN and INTERCOM_ADMIN_ID');
    process.exit(1);
  }
  
  console.log(`Using Admin ID: ${adminId}`);
  console.log(`API Token starts with: ${token.substring(0, 5)}...`);
  
  // 1. First try the /me endpoint to verify API access
  console.log('\n[1] Testing API Access:');
  try {
    const meResponse = await fetch('https://api.intercom.io/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (meResponse.ok) {
      const meData = await meResponse.json();
      console.log('✅ API access successful');
      console.log(`App ID: ${meData.app?.id_code || 'N/A'}`);
      console.log(`App Name: ${meData.app?.name || 'N/A'}`);
    } else {
      console.log(`❌ API access failed: Status ${meResponse.status}`);
      console.log(await meResponse.text());
    }
  } catch (error) {
    console.error('Error testing API access:', error);
  }
  
  // 2. Try the direct contacts endpoint
  console.log('\n[2] Testing Contacts Endpoint:');
  try {
    const contactsResponse = await fetch('https://api.intercom.io/contacts?per_page=10', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (contactsResponse.ok) {
      const contactsData = await contactsResponse.json();
      const contactsCount = contactsData.data?.length || 0;
      console.log(`✅ Retrieved ${contactsCount} contacts`);
      
      if (contactsData.pages) {
        console.log(`Total pages: ${contactsData.pages.total_pages || 'unknown'}`);
        console.log(`Per page: ${contactsData.pages.per_page || 'unknown'}`);
        console.log(`Total count: ${contactsData.pages.total_count || 'unknown'}`);
      }
      
      // Show first contact for debugging
      if (contactsCount > 0) {
        console.log('\nFirst contact example:');
        console.log(JSON.stringify(contactsData.data[0], null, 2).substring(0, 500) + '...');
      }
    } else {
      console.log(`❌ Contacts endpoint failed: Status ${contactsResponse.status}`);
      console.log(await contactsResponse.text());
    }
  } catch (error) {
    console.error('Error testing contacts endpoint:', error);
  }
  
  // 3. Try direct user search for active users
  console.log('\n[3] Testing Direct User Search for Active Users:');
  try {
    // Calculate 30 days ago in unix timestamp (seconds)
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    
    const searchResponse = await fetch('https://api.intercom.io/contacts/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: {
          field: "last_seen_at",
          operator: ">",
          value: thirtyDaysAgo
        },
        pagination: {
          per_page: 10
        }
      })
    });
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      const searchCount = searchData.data?.length || 0;
      console.log(`✅ Found ${searchCount} active users via search`);
      
      if (searchData.pages) {
        console.log(`Total pages: ${searchData.pages.total_pages || 'unknown'}`);
        console.log(`Per page: ${searchData.pages.per_page || 'unknown'}`);
        console.log(`Total count: ${searchData.pages.total_count || 'unknown'}`);
      }
      
      // Show first active user for debugging
      if (searchCount > 0) {
        console.log('\nFirst active user example:');
        console.log(JSON.stringify(searchData.data[0], null, 2).substring(0, 500) + '...');
      }
    } else {
      console.log(`❌ User search failed: Status ${searchResponse.status}`);
      console.log(await searchResponse.text());
    }
  } catch (error) {
    console.error('Error testing user search:', error);
  }
  
  // 4. Try the users scroll API
  console.log('\n[4] Testing Users Scroll API:');
  try {
    const scrollResponse = await fetch('https://api.intercom.io/users/scroll', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ per_page: 10 })
    });
    
    if (scrollResponse.ok) {
      const scrollData = await scrollResponse.json();
      const scrollCount = scrollData.users?.length || 0;
      console.log(`✅ Retrieved ${scrollCount} users via scroll API`);
      console.log(`Scroll param: ${scrollData.scroll_param ? 'Present' : 'None'}`);
      
      // Show first user for debugging
      if (scrollCount > 0) {
        console.log('\nFirst user example:');
        console.log(JSON.stringify(scrollData.users[0], null, 2).substring(0, 500) + '...');
      }
    } else {
      console.log(`❌ Scroll API failed: Status ${scrollResponse.status}`);
      console.log(await scrollResponse.text());
    }
  } catch (error) {
    console.error('Error testing scroll API:', error);
  }
  
  // 5. Try the segments API
  console.log('\n[5] Testing Segments API:');
  try {
    const segmentsResponse = await fetch('https://api.intercom.io/segments', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (segmentsResponse.ok) {
      const segmentsData = await segmentsResponse.json();
      const segmentsCount = segmentsData.segments?.length || 0;
      console.log(`✅ Retrieved ${segmentsCount} segments`);
      
      // Look for "Active" segment
      const activeSegment = segmentsData.segments?.find((segment: any) => 
        segment.name.toLowerCase().includes('active'));
      
      if (activeSegment) {
        console.log(`Found an "Active" segment: ${activeSegment.name} (ID: ${activeSegment.id})`);
        
        // Try to fetch users in this segment
        console.log(`Fetching users in the "${activeSegment.name}" segment...`);
        
        const segmentUsersResponse = await fetch(`https://api.intercom.io/contacts/search`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: {
              field: "segment_id",
              operator: "=",
              value: activeSegment.id
            },
            pagination: {
              per_page: 10
            }
          })
        });
        
        if (segmentUsersResponse.ok) {
          const segmentUsersData = await segmentUsersResponse.json();
          const usersCount = segmentUsersData.data?.length || 0;
          console.log(`Found ${usersCount} users in the "${activeSegment.name}" segment`);
          
          if (segmentUsersData.pages) {
            console.log(`Total pages: ${segmentUsersData.pages.total_pages || 'unknown'}`);
            console.log(`Per page: ${segmentUsersData.pages.per_page || 'unknown'}`);
            console.log(`Total count: ${segmentUsersData.pages.total_count || 'unknown'}`);
          }
        } else {
          console.log(`❌ Segment users search failed: Status ${segmentUsersResponse.status}`);
          console.log(await segmentUsersResponse.text());
        }
      } else {
        console.log('No "Active" segment found');
      }
    } else {
      console.log(`❌ Segments API failed: Status ${segmentsResponse.status}`);
      console.log(await segmentsResponse.text());
    }
  } catch (error) {
    console.error('Error testing segments API:', error);
  }
  
  console.log('\n====== DEBUGGING COMPLETE ======');
}

// Run the debug function
debugIntercomUsers().catch(error => {
  console.error('Fatal error occurred:', error);
  process.exit(1);
}); 