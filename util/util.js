const puppeteer = require("puppeteer");

const pupReq = async url => {
  const options = {
    args: ["--no-sandbox"],
  };

  const instaURL = "https://instagram.com/instagram";
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.goto(instaURL, { timeout: 0 });

  await page.setRequestInterception(true);

  page.on("request", async req => {
    if (req.resourceType() == "stylesheet" || req.resourceType() == "font") {
      await req.abort();
    } else {
      await req.continue();
    }
  });

  const inputSel = "input[placeholder=Search]";
  //  "#react-root > section > nav > div > div._lz6s.Hz2lF > div.MWDvN.nfCOa > div.LWmhU._0aCwM > input";

  // await page.waitForXPath(inputSel);

  await page.waitForSelector(inputSel, { timeout: 0 });

  // page.click(inputSel)

  await page.type(inputSel, url);

  await page.type(inputSel, String.fromCharCode(13));

  const resultsSel =
    "#react-root > section > nav > div > div._lz6s.Hz2lF > div.MWDvN.nfCOa > div.LWmhU._0aCwM > div:nth-child(5) > div.drKGC > div";

  const resultsX =
    '//*[@id="react-root"]/section/nav/div/div[2]/div[2]/div[2]/div[3]/div[2]/div';

  await page.waitForXPath(resultsX);

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
  };

  const instaURL = "https://instagram.com/" + uid;
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  await page.goto(instaURL);

  await page.setRequestInterception(true);

  page.on("request", async req => {
    if (req.resourceType() == "stylesheet" || req.resourceType() == "font") {
      await req.abort().catch(e => console.log(e));
    } else {
      await req.continue().catch(e => console.log(e));
    }
  });

  const title = await page.title();
  if (title.includes("Page Not Found")) {
    return null;
  }

  const numPostsSel = "span.g47SY";
  const numFollowersSel = "span.g47SY";

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

module.exports = { pupReq, getUser };

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
