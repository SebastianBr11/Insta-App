const puppeteer = require("puppeteer");
const fs = require("fs.promises");

const pupReq = async url => {
  const options = {
    args: ["--no-sandbox"],
    headless: true,
  };

  const instaURL = "https://www.instagram.com/accounts/login/";
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.goto(instaURL, { timeout: 10000 });

  await page.setRequestInterception(true);

  page.on("request", async req => {
    if (req.resourceType() == "font") {
      await req.abort();
    } else {
      await req.continue();
    }
  });

  try {
    const cookiesString = await fs.readFile("./cookies.json");
    if (cookiesString) {
      const cookies = JSON.parse(cookiesString);
      await page.setCookie(...cookies);
    }
  } catch (e) {
    console.log(e);
    return 401;
  }

  try {
    const nameInputSel = "input[name=username]";
    const passwordInputSel = "input[name=password]";

    await page.waitForSelector(nameInputSel, { timeout: 5000 });

    await page.type(nameInputSel, "asdasdasd");
    await page.type(passwordInputSel, "asdsadaaaaa");
    await page.waitFor(2000);
    await page.type(passwordInputSel, String.fromCharCode(13));
    await page.waitForNavigation({ timeout: 10000 });
  } catch (e) {
    console.log("erorr " + e);
    throw new Error("eror logging in");
  }

  const inputSel = "input[placeholder=Search]";
  //  "#react-root > section > nav > div > div._lz6s.Hz2lF > div.MWDvN.nfCOa > div.LWmhU._0aCwM > input";

  // await page.waitForXPath(inputSel);

  await page.waitForSelector(inputSel, { timeout: 10000 });

  // page.click(inputSel)

  await page.type(inputSel, url);

  await page.type(inputSel, String.fromCharCode(13));

  const resultsSel = "div.drKGC div.fuqBx";

  await page.waitFor(resultsSel);

  const thing = await page.$(resultsSel);

  const obj = {
    url: null,
    src: null,
    title: null,
    subtitle: null,
  };

  const a = await thing.$$("a");

  // const b = await Promise.all(
  //   a.map(async b => {
  //     const url = await b.getProperty("href");

  //     const imgSel =
  //       "#react-root > section > nav > div._8MQSO.Cx7Bp > div > div > div.LWmhU._0aCwM > div:nth-child(5) > div.drKGC > div > a.yCE8d.JvDyy > div > div.RR-M-.g9vPa > span > img";

  //     page.waitForSelector(imgSel);

  //     const src = await b.$eval(imgSel, img => img.getAttribute("src"));

  //     const title = await b.$eval(titleSel, title => title.textContent);

  //     const subSel =
  //       "#react-root > section > nav > div._8MQSO.Cx7Bp > div > div > div.LWmhU._0aCwM > div:nth-child(5) > div.drKGC > div > a.yCE8d.JvDyy > div > div._2_M76 > div > span";

  //     const subtitle = await b.$eval(subSel, sub => sub.textContent);

  //     return { url, src, title, subtitle };
  //   })
  // ).catch(e => console.log(e));

  const results = await Promise.all(
    a.map(async item => {
      const obj = {
        url: "",
        src: null,
        title: "",
        subtitle: "",
      };

      const titleSel = "span.Ap253";

      obj.url = await (await item.getProperty("href")).jsonValue();

      obj.subtitle = await getSubtitle(item);

      obj.src = await getImgSrc(item, obj.url);

      obj.title = await item.$eval(titleSel, title => title.textContent);

      return obj;
    })
  );

  // console.log(b);

  await browser.close();

  return results;
};

const getUser = async uid => {
  const options = {
    args: ["--no-sandbox"],
    headless: true,
  };

  const instaURL = "https://www.instagram.com/accounts/login/";
  const newUrl = "https://instagram.com/" + uid;
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.goto(instaURL);

  await page.setRequestInterception(true);

  page.on("request", async req => {
    if (req.resourceType() == "font") {
      await req.abort().catch(e => console.log(e));
    } else {
      await req.continue().catch(e => console.log(e));
    }
  });

  try {
    const cookiesString = await fs.readFile("./cookies.json");
    if (cookiesString) {
      const cookies = JSON.parse(cookiesString);
      await page.setCookie(...cookies);
    }
  } catch (e) {
    console.log(e);
    return null;
  }

  try {
    const nameInputSel = "input[name=username]";
    const passwordInputSel = "input[name=password]";

    await page.waitForSelector(nameInputSel, { timeout: 5000 });

    await page.type(nameInputSel, "asdasdasd");
    await page.type(passwordInputSel, "asdsadaaaaa");
    await page.waitFor(2000);
    await page.type(passwordInputSel, String.fromCharCode(13));
    await page.waitForNavigation({ timeout: 10000 });
    await page.waitForSelector("input[placeholder=Search");
    await page.goto(newUrl);
  } catch (e) {
    console.log("erorr " + e);
    throw new Error("eror logging in");
  }

  const title = await page.title();
  if (title.includes("Page Not Found")) {
    return null;
  }

  const numPostsSel = "span.g47SY";

  await page.waitForSelector(numPostsSel);

  const attrs = await page.$$(numPostsSel);

  const [posts, followers, following] = await Promise.all(
    attrs.map(async item => {
      const title = await (await item.getProperty("title")).jsonValue();
      if (title) {
        // Followers
        return await title;
      }
      const textContent = await item.evaluate(el => el.textContent);
      return textContent;
    })
  );

  const descContainerSel = "div.-vDIg";

  const descContainer = await page.$(descContainerSel);

  let link = null;
  let name = null;
  let desc = null;
  let authorId = null;
  let linkText = null;
  try {
    name = await descContainer.$eval("h1", el => el.textContent);
    desc = await descContainer.$eval("span", el => el.textContent);
    link = await descContainer.$eval("a.yLUwa", el => el.getAttribute("href"));
    authorId = await descContainer.$eval("a.yLUwa", el =>
      el.getAttribute("author_id")
    );
    linkText = await descContainer.$eval("a.yLUwa", el => el.textContent);
  } catch (e) {}

  await browser.close();

  return {
    uid,
    authorId,
    name,
    desc,
    posts,
    followers,
    following,
    link,
    linkText,
  };
};

const tryLogin = async login => {
  const options = {
    args: ["--no-sandbox"],
    headless: false,
  };

  const url = "https://www.instagram.com/accounts/login/";

  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.goto(url);

  await page.setRequestInterception(true);

  page.on("request", async req => {
    if (req.resourceType() == "stylesheet" || req.resourceType() == "font") {
      await req.abort().catch(e => console.log(e));
    } else {
      await req.continue().catch(e => console.log(e));
    }
  });

  let code = "good";
  try {
    const cookiesString = await fs.readFile("./cookies.json");
    if (cookiesString) {
      const cookies = JSON.parse(cookiesString);
      await page.setCookie(...cookies);
      browser.close();
      return code;
    }
  } catch (e) {
    console.log(e);
    code = "401";
    return code;
  }

  const nameInputSel = "input[name=username]";
  const passwordInputSel = "input[name=password]";

  await page.waitForSelector(nameInputSel);
  console.log(login);

  await page.type(nameInputSel, login.username.toString());
  await page.type(passwordInputSel, login.password.toString());
  await page.waitFor(2000);
  await page.type(passwordInputSel, String.fromCharCode(13));
  await page.waitForNavigation({ timeout: 10000 }).catch(() => {
    browser.close();
    code = 404;
  });

  const cookies = await page.cookies();
  console.log(cookies);
  await fs.writeFile("./cookies.json", JSON.stringify(cookies, null, 2));

  await browser.close();
  return code;
};

module.exports = { pupReq, getUser, tryLogin };

const getSubtitle = async item => {
  const subtitle = await item.$eval(".Fy4o8", sub => sub.textContent);

  return subtitle;
};

const getImgSrc = async (item, url) => {
  url = url.replace("https://www.instagram.com/", "");

  if (!url.startsWith("explore/")) {
    return await item.$eval("img", img => img.getAttribute("src"));
  }

  return "https://www.instagram.com/static/bundles/es6/sprite_core_32f0a4f27407.png/32f0a4f27407.png";
};
