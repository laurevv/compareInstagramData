// follower filtering script

// redirects to instagram
if (window.location.origin !== "https://www.instagram.com") {
  alert("You need to be on Instagram. Redirecting...");
  window.location.href = "https://www.instagram.com";
  console.clear();
}

// utility funcs
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const random = (min, max) => Math.floor(Math.random() * (max - min)) + min;

const fetchOptions = {
  credentials: "include",
  headers: { "X-IG-App-ID": "936619743392459" },
  method: "GET",
};

// fetch full list of followers/following
async function fetchUsersList(type, userId, count = 100, maxId = "") {
  let url = `https://www.instagram.com/api/v1/friendships/${userId}/${type}/?count=${count}`;
  if (maxId) url += `&max_id=${maxId}`;

  const response = await fetch(url, fetchOptions);
  const data = await response.json();

  const users = data.users || [];

  if (data.next_max_id) {
    await sleep(random(500, 1000));
    const moreUsers = await fetchUsersList(type, userId, count, data.next_max_id);
    return users.concat(moreUsers);
  }

  return users;
}

// get instagram user ID by username
async function getUserIdByUsername(username) {
  const url = `https://www.instagram.com/api/v1/web/search/topsearch/?context=blended&query=${username}&include_reel=false`;
  const response = await fetch(url, fetchOptions);
  const data = await response.json();

  return data.users?.find(
    (user) => user.user.username.toLowerCase() === username.toLowerCase()
  )?.user.pk || null;
}

// compare followers and following
async function compareData(username) {
  const userId = await getUserIdByUsername(username);
  if (!userId) throw new Error(`User not found: ${username}`);

  const [followers, following] = await Promise.all([
    fetchUsersList("followers", userId),
    fetchUsersList("following", userId),
  ]);

  const followersSet = new Set(followers.map((u) => u.username.toLowerCase()));
  const followingSet = new Set(following.map((u) => u.username.toLowerCase()));

  console.log("-".repeat(30));
  console.log(`Followers: ${followersSet.size} | Following: ${followingSet.size}`);

  const notFollowingBack = [...followingSet].filter((u) => !followersSet.has(u));
  const notFollowedBack = [...followersSet].filter((u) => !followingSet.has(u));

  return {
    notFollowingBack,
    notFollowedBack,
  };
}

// check if everyone follows you back (silent unless true)
function checkIfEveryoneFollowsBack(notFollowedBack) {
  if (notFollowedBack.length === 0) {
    console.log("Everyone who you follow also follows you back!");
  }
}

// replace "example_username" with your Instagram username
const username = "example_username";

compareData(username).then((result) => {
  console.log("Not following you back:", result.notFollowingBack);
  console.log("You’re not following back:", result.notFollowedBack);
  checkIfEveryoneFollowsBack(result.notFollowedBack);
});
