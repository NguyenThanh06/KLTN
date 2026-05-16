//Mới dán đại thôi
const location = useLocation();

useEffect(() => {
  if (location.state?.showForbiddenModal) {
    setModalConfig({
      isOpen: true,
      type: 'info',
      title: "Truy cập bị từ chối",
      description: location.state.reason
    });
    // Xóa state để tránh việc F5 lại trang nó lại hiện modal
    window.history.replaceState({}, document.title);
  }
}, [location]);