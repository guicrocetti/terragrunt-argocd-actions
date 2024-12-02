async function action(ctx, next) {
  ctx.body = 'hello action';
  console.log(ctx.body);
}

action({body: 'hello'});
