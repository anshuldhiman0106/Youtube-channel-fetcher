// ✅ Replace with your actual API key
const API_KEY =  KEY;

// Skeleton Loader
function showSkeletonLoader() {
  document.getElementById('output').innerHTML = `
    <div class="animate-pulse space-y-4">
      <div class="flex items-center space-x-4">
        <div class="w-16 h-16 bg-gray-400 rounded-full"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-gray-400 rounded w-3/4"></div>
          <div class="h-4 bg-gray-400 rounded w-1/2"></div>
        </div>
      </div>
      <div class="space-y-2">
        <div class="h-4 bg-gray-400 rounded w-1/2"></div>
        <div class="h-4 bg-gray-400 rounded w-1/3"></div>
        <div class="h-4 bg-gray-400 rounded w-1/4"></div>
      </div>
    </div>
  `;
}

// 🔎 Step 1: Fetch channel by username using the `search` endpoint
async function fetchChannelByUsername() {
  const username = document.getElementById('usernameInput').value.trim();
  if (!username) return;

  showSkeletonLoader();

  const searchURL = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(username)}&key=${API_KEY}`;

  try {
    const res = await fetch(searchURL);
    const data = await res.json();
    console.log(data);

    if (!data.items || data.items.length === 0) {
      document.getElementById('output').innerHTML = `<p class="text-red-500 mt-4">No channel found for "${username}"</p>`;
      return;
    }

    document.getElementById('output').innerHTML = await ChannelsInfo(data);
    // Optional: Auto-fetch detailed info for the first result
    // const channelId = data.items[0].snippet.channelId;
    // getChannelInfo(channelId);
  } catch (error) {
    document.getElementById('output').innerHTML = `<p class="text-red-500 mt-4">Error: ${error.message}</p>`;
  }
}

// Step 2: Get full channel info (statistics, uploads, etc.)
async function getChannelInfo(channelId) {
  showSkeletonLoader();

  const detailsURL = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${API_KEY}`;

  try {
    const res = await fetch(detailsURL);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      document.getElementById('output').innerHTML = `<p class="text-red-500 mt-4">No data found.</p>`;
      return;
    }

    const channel = data.items[0];
    const { title, description, thumbnails } = channel.snippet;
    const { subscriberCount, videoCount, viewCount } = channel.statistics;
    const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

    let html = `
      <div class="flex items-center gap-4">
        <img src="${thumbnails.default.url}" alt="Channel Picture" class="rounded-full w-16 h-16" />
        <div>
          <h2 class="text-xl font-bold">${title}</h2>
          <p class="text-sm text-gray-300">${description || 'No description available.'}</p>
        </div>
      </div>
      <div class="mt-4 space-y-1 text-gray-200">
        <p><strong>Subscribers:</strong> ${subscriberCount}</p>
        <p><strong>Videos:</strong> ${videoCount}</p>
        <p><strong>Total Views:</strong> ${viewCount}</p>
      </div>
      <h3 class="text-lg font-semibold text-red-300 mt-6 mb-2">Latest Videos</h3>
    `;

    const videos = await fetchLatestVideos(uploadsPlaylistId);
    html += videos;

    document.getElementById('output').innerHTML = html;
  } catch (error) {
    document.getElementById('output').innerHTML = `<p class="text-red-500 mt-4">Error fetching channel details.</p>`;
  }
}

// Step 3: Fetch latest videos from playlist
async function fetchLatestVideos(playlistId) {
  const videosURL = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=6&playlistId=${playlistId}&key=${API_KEY}`;

  try {
    const res = await fetch(videosURL);
    const data = await res.json();

    if (!data.items || data.items.length === 0) return `<p>No recent videos found.</p>`;

    const videosHTML = data.items.map(item => {
      const videoId = item.snippet.resourceId.videoId;
      const title = item.snippet.title;
      const thumb = item.snippet.thumbnails.medium.url;
      return `
        <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="block bg-white/5 border border-white/10 p-2 rounded-xl hover:bg-white/10 transition">
          <img src="${thumb}" alt="${title}" class="rounded-md w-full mb-2" />
          <p class="text-sm font-medium text-gray-100">${title}</p>
        </a>
      `;
    }).join('');

    return `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">${videosHTML}</div>`;
  } catch (error) {
    return `<p class="text-red-500">Error fetching videos.</p>`;
  }
}

// Helper: Render search results (channel cards)
async function ChannelsInfo(data) {
  try {
    const Channels = data.items.map(item => {
      const ChTitle = item.snippet.channelTitle;
      const description = item.snippet.description;
      const logourl = item.snippet.thumbnails.medium.url;
      const channelId = item.snippet.channelId;

      return `
        <div onclick="getChannelInfo('${channelId}')" class="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 rounded-full overflow-hidden">
              <img src="${logourl}" alt="${ChTitle}" class="w-full h-full object-cover">
            </div>
            <div class="flex-1">
              <p class="text-lg font-semibold text-gray-100">${ChTitle}</p>
            </div>
          </div>
          <div>
            <p class="text-sm text-gray-300">${description}</p>
          </div>
        </div>
      `;
    }).join('');

    return `<div class="flex flex-col gap-3">${Channels}</div>`;
  } catch (error) {
    return `<p class="text-red-500">Error fetching channel information.</p>`;
  }
}
