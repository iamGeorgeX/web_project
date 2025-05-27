export function requireLogin(req, res, next) {
  if (req.session.user && req.session) {

    return  next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');

}

export function requireOrganiserLogin(req, res, next) {
  if (req.session && req.session.user && req.session.user.organiser_id) {
    return next();
  }
   req.session.returnTo = req.originalUrl;
  res.redirect('/login');
}

export function requireUserLogin(req, res, next) {
  if (req.session && req.session.user && (req.session.user.role== 'user' )) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
}