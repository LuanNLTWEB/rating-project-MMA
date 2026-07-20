const fs = require('fs');
const path = require('path');

const tabsDir = path.join(__dirname, '../app/(tabs)');
const filesToPatch = [
  path.join(tabsDir, 'index.jsx'),
  path.join(tabsDir, 'explore.jsx'),
  path.join(tabsDir, 'favorites.jsx'),
  path.join(tabsDir, 'watchlist.jsx'),
  path.join(__dirname, '../app/news/index.jsx')
];

const newLink = `
              {user && user.role === 'staff' && (
                <TouchableOpacity
                  style={styles.menuItemRow}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push('/manage-reports');
                  }}
                >
                  <Text style={[styles.menuItemText, { color: '#E67E22' }]}>MANAGE REPORTS (STAFF)</Text>
                </TouchableOpacity>
              )}
`;

filesToPatch.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('router.push(\'/manage-reports\')')) {
      // Find the manage-news link to insert after
      const newsLinkMatch = content.match(/<Text style={\[styles\.menuItemText, { color: '#E67E22' }\]}>MANAGE MOVIES \(STAFF\)<\/Text>\s*<\/TouchableOpacity>\s*}\)/);
      if (newsLinkMatch) {
        content = content.replace(newsLinkMatch[0], newsLinkMatch[0] + newLink);
        fs.writeFileSync(file, content);
        console.log("Updated " + file);
      } else {
        console.log("Manage news link not found in " + file);
      }
    } else {
      console.log("Already updated " + file);
    }
  } else {
    console.log("File not found: " + file);
  }
});
