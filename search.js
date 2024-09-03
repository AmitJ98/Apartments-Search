import axios from 'axios';
import * as cheerio from 'cheerio';
import twilio from 'twilio';

const twilioClient = twilio(accountSid, authToken);

const twilioNumber = 'whatsapp:+12514511043'; 
const yourNumber = 'whatsapp:+972506360636'; 

const url = 'https://www.yad2.co.il/realestate/rent';

const searchCriteria = {
    city: 'Tel Aviv',
    price: { min: 2500, max: 10000 },
    rooms: { min: 4, max: 5 },
};

async function checkForNewApartments() {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const apartments = [];

        $('.feeditem').each((index, element) => {
            const title = $(element).find('.title').text().trim();
            const price = parseInt($(element).find('.price').text().replace(/[^\d]/g, ''), 10);
            const rooms = parseFloat($(element).find('.rooms').text().trim());
            const link = $(element).find('.title a').attr('href'); 
            console.log(title,price,rooms,link)

            if (
                title.includes(searchCriteria.city) &&
                price >= searchCriteria.price.min && price <= searchCriteria.price.max &&
                rooms >= searchCriteria.rooms.min && rooms <= searchCriteria.rooms.max
            ) {
                apartments.push({ title, price, rooms, link });
            }
        });

        if (apartments.length > 0) {
            apartments.forEach(async (apt) => {
                const fullLink = `https://www.yad2.co.il${apt.link}`;
                console.log(`Found matching apartment: ${apt.title} - ${apt.price} ILS, ${apt.rooms} rooms`);
                await twilioClient.messages.create({
                    from: twilioNumber,
                    to: yourNumber,
                    body: `New Apartment Found: ${apt.title} - ${apt.price} ILS, ${apt.rooms} rooms\nLink: ${fullLink}`,
                });
            });
        } else {
            console.log('No matching apartments found.');
        }
    } catch (error) {
        console.error('Error fetching the Yad2 page:', error);
    }
}

setInterval(checkForNewApartments, 6000);
