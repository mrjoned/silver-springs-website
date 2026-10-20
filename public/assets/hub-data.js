(function () {
  'use strict';
  window.SSSHubData = {
    async fetch() {
      try {
        const response = await window.fetch('/api/enchantments');
        if (response.ok) return response;
      } catch (_) {}
      const backup = await window.fetch('/runecrafting-hub/tools/enchantments.json');
      if (!backup.ok) throw new Error('Reference data unavailable');
      const data = await backup.json();
      return new Response(JSON.stringify({ ...data, _dataSource: 'snapshot' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
})();
