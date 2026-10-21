(function () {
  'use strict';
  window.SSSHubData = {
    async fetch() {
      for (const url of ['/api/enchantments','/runecrafting-hub/tools/enchantments.json']) {
        try {
          const response = await window.fetch(url);
          if (!response.ok) continue;
          const data = await response.json();
          if (!Array.isArray(data.enchantments) || !Array.isArray(data.items)) continue;
          return Response.json({ ...data, _dataSource: 'repository' });
        } catch (_) {}
      }
      throw new Error('Published enchantment catalog unavailable');
    }
  };
})();
