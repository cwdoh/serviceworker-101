console.log('SW module is loaded', self);

self.addEventListener('install', function(event) {
  // 캐싱을 위한 리소스 패치 도중 서비스워커가 종료되지 않도록 생명주기를 Promise 종료 시까지 연장합니다.
  event.waitUntil(
    // cache-v1이라는 이름으로 Cache Storage를 생성하고,
    caches.open('cache-v1').then(function(cache) {
      // 기술된 모든 리소스를 미리 fetch해서 캐시에 저장해둡니다.
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/profile/anonymous.jpg',
        '/profile/1.png',
        '/profile/2.png',
        '/profile/3.png',
        '/profile/4.png'
      ]);
    })
  );

  // 즉시 현재 서비스워커를 설치하도록 대기 상태를 건너뜁니다.
  self.skipWaiting();

  console.log('SW installed', event);

});

self.addEventListener('activate', function(event) {
  console.log('SW activated', event);
});

// fetch 이벤트는 페이지에서 서비스워커가 관장하는 URL scope에 해당하는 요청이 발생 시 이벤트로 전달됩니다.
self.addEventListener('fetch', function(event) {
  console.log(event.request.url);
  var req = event.request.url;
  // anonymous.jpg에 대한 요청이라면
  if (req.indexOf('anonymous.jpg') != -1) {
    // url을 바꿉니다. :-)
    req = req.substr(0, req.indexOf('anonymous.jpg')) + (parseInt(Math.random() * 4) + 1) + '.png';
  }

  // 요청에 대해 내부에 기술된 대로 응답합니다.
  event.respondWith(
    // 현재 요청과 매치되는 캐시 데이터가 있는지 확인해서
    caches.match(req).then(function(response) {
      // 있다면 해당 캐시 데이터를 전달하고,
      return response
        // 없다면 네트워크 fetch를 통해 전달합니다.
        || fetch(event.request);
    })
  );
});

// push 이벤트는 등록된 gcm_sender_id로 메세지가 전달될 경우 이벤트로 전달됩니다.
self.addEventListener('push', function(event) {
  console.log('Push message received', event);

  // 본래는 전달된 payload를 event.data를 통해 액세스해야 하지만,
  // 암호화되지 않은 메세지는 전달되지 않으므로 테스트 상의 편의를 위해 동일-_-한 메세지로 고정합니다.
  var title = 'Hello, GDGs!!';
  var description = {
    body: 'GDG 7월 밋업에 오신 것을 환영합니다.',
    icon: 'https://developers.google.com/_static/888a19f2d7/images/gdg-program-icon.png?hl=ko',
    tag: 'my-tag'
  };

  event.waitUntil(
    // notification을 띄워줍니다.
    self.registration.showNotification(title, description));
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification click: tag ', event.notification.tag);

  // notification에는 자동 닫기 기능이 없으므로, 클릭 시 닫기는 매뉴얼하게 호출
  event.notification.close();

  var url = 'https://festi.kr/festi/gdg-korea-2016-july/';

  // 클라이언트 관련 동작이 중간에 종료되지 않도록 생명주기를 연장합니다.
  event.waitUntil(
    // 윈도우 타입의 브라우징 컨텍스트를 찾고,
    clients.matchAll({
      type: 'window'
    })
    .then(function(windowClients) {
      // 전체 윈도우 클라이언트 중
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        // 동일한 URL을 가진 클라이언트가 있다면
        if (client.url === url && 'focus' in client) {
          // 해당 클라이언트로 포커스합니다.
          return client.focus();
        }
      }
      // 그렇지 않다면 별도로 창을 엽니다.
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
