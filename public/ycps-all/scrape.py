import bs4
from bs4 import BeautifulSoup
import pycurl
import re
import urllib2
import codecs

subjectsFile = open('subjects.txt.old', 'r')
outputFile = open('index.html', 'w')
output = '<!doctype html><html><head><title>All Yale Courses</title><link rel="stylesheet" type="text/css" href="style.css"></head><body>'

rootURL = 'http://catalog.yale.edu/ycps/subjects-of-instruction/'
subject = subjectsFile.readline() # ''.join(subjectsFile.readline().split())   

while subject:
    formattedSubject = subject
    subject = re.sub(' and| the', '', subject)
    subject = re.sub('[.!\n\',;]', '', subject)
    subject = re.sub(' +', '-', subject)
    if not re.search('See', subject):
        subject = subject.lower()
        url = rootURL + subject + '/#coursestext'
        url = url.rstrip("\n").rstrip("/") 
        try:
            site = urllib2.urlopen(urllib2.Request(url))
            html = urllib2.unquote(site.read())
            givenURL = url
            finalURL = site.geturl().rstrip("/")
            soup = BeautifulSoup(html)

            content = soup.find(id='content')
            
            if soup.find(id='courseinventorycontainer'):
                description = soup.find(id='textcontainer')
                description.decompose()

            tabs = soup.find(id='tabs')
            if tabs: tabs.decompose()

            if not content:
                print 'error: ' + subject
                print '>' +formattedSubject
            else:
                content = content.prettify()
                content = content.encode('ascii', 'xmlcharrefreplace')
                output += content
        except:
            print 'error: ' + subject
            print '>' +formattedSubject

    subject = subjectsFile.readline()
    # subject = None

output += '</body></html>'
outputFile.write(output)
outputFile.close()
print 'Done!'
