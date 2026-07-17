const dns = require('dns');

console.log("Using default OS DNS settings:");
dns.resolveSrv('_mongodb._tcp.cluster0.nry6rnt.mongodb.net', (err, addresses) => {
  if (err) {
    console.error("OS DNS Failed:", err);
  } else {
    console.log("OS DNS Success:", addresses);
  }

  console.log("\nSetting DNS to Google (8.8.8.8) and Cloudflare (1.1.1.1)...");
  dns.setServers(['8.8.8.8', '1.1.1.1']);

  dns.resolveSrv('_mongodb._tcp.cluster0.nry6rnt.mongodb.net', (err2, addresses2) => {
    if (err2) {
      console.error("Google/Cloudflare DNS Failed:", err2);
    } else {
      console.log("Google/Cloudflare DNS Success:", addresses2);
    }
  });
});
